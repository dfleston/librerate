// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title  RoyaltyCertificate
 * @notice ERC-721 certificates that entitle holders to a proportional share
 *         of USDC royalty distributions from La Promesa Devuelta.
 *
 * Key design decisions
 * ────────────────────
 * • ERC721Enumerable  — allows frontend/backend to iterate token IDs per owner
 *                       without relying on event log scanning.
 * • Pull distribution — holders claim their own USDC; no unbounded loop.
 * • ERC2981           — secondary-market royalty standard (OpenSea, etc.).
 * • Pausable          — owner can halt claims during disputes or upgrades.
 * • Offering states   — explicit lifecycle (NotStarted → Open → Closed).
 * • SafeERC20         — safe transfer wrapper for non-standard ERC20s.
 * • Burn support      — totalShares and claimable balances update on burn.
 * • Offering cap      — minting cannot exceed totalOfferedBps.
 */
contract RoyaltyCertificate is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    ERC2981,
    Ownable,
    Pausable
{
    using SafeERC20 for IERC20;

    // ─── Constants ─────────────────────────────────────────────────────────────

    /// @dev 1 USDC = 1_000_000 units (6 decimals on Polygon)
    uint256 public constant USDC_DECIMALS = 1e6;

    // ─── Token counter ─────────────────────────────────────────────────────────

    uint256 private _tokenIds;

    // ─── Royalty share accounting ──────────────────────────────────────────────

    /// @notice Basis-point share per token (10 000 bps = 100 %)
    mapping(uint256 => uint256) public shares;

    /// @notice Sum of all outstanding share bps
    uint256 public totalShares;

    // ─── USDC distribution (pull model) ───────────────────────────────────────

    IERC20 public immutable usdc;

    /// @notice Cumulative USDC deposited for distribution (ever-increasing)
    uint256 public totalDeposited;

    /// @notice Snapshot of totalDeposited at the time each token last claimed
    mapping(uint256 => uint256) public claimedUpTo;

    // ─── Offering terms ────────────────────────────────────────────────────────
    // USD amounts stored in cents (e.g. 5 000 = $50.00)

    /// @notice Minimum purchase amount in cents
    uint256 public minBuyAmountUSD;

    /// @notice Total % of royalties offered, in basis points
    uint256 public totalOfferedBps;

    /// @notice Total USD value of the full offering in cents
    uint256 public offeringValueUSD;

    // ─── Offering lifecycle ────────────────────────────────────────────────────

    enum OfferingState { NotStarted, Open, Closed }
    OfferingState public offeringState;

    // ─── Events ────────────────────────────────────────────────────────────────

    event CertificateMinted(address indexed to, uint256 indexed tokenId, uint256 shareBps);
    event CertificateBurned(uint256 indexed tokenId, uint256 shareBps);
    event USDCDeposited(uint256 amount, uint256 newTotalDeposited);
    event USDCClaimed(address indexed holder, uint256 indexed tokenId, uint256 amount);
    event OfferingTermsSet(uint256 minBuyAmountUSD, uint256 totalOfferedBps, uint256 offeringValueUSD);
    event OfferingOpened();
    event OfferingClosed();

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor(address _usdcAddress)
        ERC721("BookRoyaltyCertificate", "ROYALTY")
        Ownable(msg.sender)
    {
        require(_usdcAddress != address(0), "Invalid USDC address");
        usdc = IERC20(_usdcAddress);

        // 2.5% secondary-sale royalty to the contract owner (ERC2981)
        // Proceeds can be swept by the owner via withdrawUSDC()
        _setDefaultRoyalty(msg.sender, 250);
    }

    // ─── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyWhenOpen() {
        require(offeringState == OfferingState.Open, "Offering is not open");
        _;
    }

    // ─── Offering lifecycle ────────────────────────────────────────────────────

    /**
     * @notice Define the terms of this royalty offering.
     *         Can only be called before the offering is opened.
     */
    function setOfferingTerms(
        uint256 _minBuyAmountUSD,
        uint256 _totalOfferedBps,
        uint256 _offeringValueUSD
    ) external onlyOwner {
        require(offeringState == OfferingState.NotStarted, "Offering already started");
        require(_minBuyAmountUSD > 0, "Min buy must be > 0");
        require(_totalOfferedBps > 0 && _totalOfferedBps <= 10_000, "Invalid offered bps");
        require(_offeringValueUSD > 0, "Offering value must be > 0");
        require(_minBuyAmountUSD <= _offeringValueUSD, "Min buy exceeds offering value");

        minBuyAmountUSD  = _minBuyAmountUSD;
        totalOfferedBps  = _totalOfferedBps;
        offeringValueUSD = _offeringValueUSD;

        emit OfferingTermsSet(_minBuyAmountUSD, _totalOfferedBps, _offeringValueUSD);
    }

    /// @notice Open the offering so certificates can be minted.
    function openOffering() external onlyOwner {
        require(offeringState == OfferingState.NotStarted, "Already started");
        require(totalOfferedBps > 0, "Set terms first");
        offeringState = OfferingState.Open;
        emit OfferingOpened();
    }

    /// @notice Close the offering — no further minting allowed.
    function closeOffering() external onlyOwner {
        require(offeringState == OfferingState.Open, "Not open");
        offeringState = OfferingState.Closed;
        emit OfferingClosed();
    }

    /// @notice Read current offering terms.
    function getOfferingTerms() external view returns (
        uint256 minBuy,
        uint256 offeredBps,
        uint256 offerValue,
        OfferingState state
    ) {
        return (minBuyAmountUSD, totalOfferedBps, offeringValueUSD, offeringState);
    }

    // ─── Mint ──────────────────────────────────────────────────────────────────

    /**
     * @notice Mint a Royalty Certificate.
     *         Called by the backend after a successful Stripe payment.
     * @param to               Recipient (Privy embedded wallet address)
     * @param uri              IPFS metadata URI
     * @param shareBasisPoints Share in basis points (e.g. 25 = 0.25 %)
     */
    function mintCertificate(
        address to,
        string memory uri,
        uint256 shareBasisPoints
    ) external onlyOwner onlyWhenOpen returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(shareBasisPoints > 0, "Share must be > 0");
        require(
            totalShares + shareBasisPoints <= totalOfferedBps,
            "Exceeds offering cap"
        );

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);

        shares[newTokenId]  = shareBasisPoints;
        totalShares        += shareBasisPoints;

        // New token starts its claim cursor at the current totalDeposited
        // so it does not claim USDC deposited before it existed.
        claimedUpTo[newTokenId] = totalDeposited;

        emit CertificateMinted(to, newTokenId, shareBasisPoints);
        return newTokenId;
    }

    // ─── Distribution (pull model) ─────────────────────────────────────────────

    /**
     * @notice Owner deposits USDC into the contract for distribution.
     *         Emits USDCDeposited so the backend can notify holders.
     * @param amount Amount of USDC (in token units, 6 decimals) to deposit.
     */
    function depositRoyalties(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        totalDeposited += amount;
        emit USDCDeposited(amount, totalDeposited);
    }

    /**
     * @notice Calculate the USDC owed to a specific token since its last claim.
     * @param tokenId The token to query.
     */
    function pendingUSDC(uint256 tokenId) public view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        if (totalShares == 0) return 0;

        uint256 unclaimedPool = totalDeposited - claimedUpTo[tokenId];
        return (unclaimedPool * shares[tokenId]) / totalShares;
    }

    /**
     * @notice Claim all pending USDC for a token you own.
     * @param tokenId The token to claim for.
     */
    function claim(uint256 tokenId) external whenNotPaused {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");

        uint256 owed = pendingUSDC(tokenId);
        require(owed > 0, "Nothing to claim");

        claimedUpTo[tokenId] = totalDeposited;
        usdc.safeTransfer(msg.sender, owed);

        emit USDCClaimed(msg.sender, tokenId, owed);
    }

    /**
     * @notice Claim pending USDC for all tokens owned by the caller in one tx.
     */
    function claimAll() external whenNotPaused {
        uint256 count = balanceOf(msg.sender);
        require(count > 0, "No certificates");

        uint256 totalOwed;
        for (uint256 i = 0; i < count; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i);
            uint256 owed    = pendingUSDC(tokenId);
            if (owed > 0) {
                claimedUpTo[tokenId] = totalDeposited;
                totalOwed += owed;
                emit USDCClaimed(msg.sender, tokenId, owed);
            }
        }

        require(totalOwed > 0, "Nothing to claim");
        usdc.safeTransfer(msg.sender, totalOwed);
    }

    // ─── Emergency / admin ─────────────────────────────────────────────────────

    /// @notice Pause all claims (emergency use).
    function pause() external onlyOwner { _pause(); }

    /// @notice Resume claims.
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Sweep any USDC that is not owed to certificate holders.
     *         Useful for recovering secondary-sale royalties (ERC2981 flows).
     *         Cannot sweep funds owed to holders — only the surplus.
     */
    function withdrawUSDC(uint256 amount) external onlyOwner {
        uint256 contractBalance = usdc.balanceOf(address(this));
        // The surplus is everything beyond what was deposited for holders
        // (totalDeposited tracks the holder pool exactly)
        uint256 surplus = contractBalance > totalDeposited
            ? contractBalance - totalDeposited
            : 0;
        require(amount <= surplus, "Would withdraw holder funds");
        usdc.safeTransfer(msg.sender, amount);
    }

    // ─── Burn ──────────────────────────────────────────────────────────────────

    /**
     * @notice Burn a certificate. Outstanding USDC is forfeited.
     *         Only the token owner can burn their own certificate.
     */
    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _burnCertificate(tokenId);
    }

    function _burnCertificate(uint256 tokenId) internal {
        uint256 bps = shares[tokenId];
        totalShares      -= bps;
        shares[tokenId]   = 0;
        claimedUpTo[tokenId] = 0;
        _burn(tokenId);
        emit CertificateBurned(tokenId, bps);
    }

    // ─── ERC721Enumerable helpers (for dashboard) ──────────────────────────────

    /**
     * @notice Return all token IDs owned by an address.
     *         Called by the backend /api/user-certificates endpoint.
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 count  = balanceOf(owner);
        uint256[] memory ids = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            ids[i] = tokenOfOwnerByIndex(owner, i);
        }
        return ids;
    }

    /**
     * @notice Return share bps and pending USDC for all tokens of an owner.
     *         Single call replaces all the event-scanning logic in the dashboard.
     */
    function portfolioOf(address owner) external view returns (
        uint256[] memory tokenIds,
        uint256[] memory shareBps,
        uint256[] memory pendingAmounts,
        uint256 totalShareBps,
        uint256 totalPending
    ) {
        uint256 count = balanceOf(owner);
        tokenIds       = new uint256[](count);
        shareBps       = new uint256[](count);
        pendingAmounts = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 id          = tokenOfOwnerByIndex(owner, i);
            tokenIds[i]        = id;
            shareBps[i]        = shares[id];
            pendingAmounts[i]  = pendingUSDC(id);
            totalShareBps     += shares[id];
            totalPending      += pendingAmounts[i];
        }
    }

    // ─── Required overrides ────────────────────────────────────────────────────

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
