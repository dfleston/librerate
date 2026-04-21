// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RoyaltyCertificate is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    // Mapping from tokenId to revenue share percentage (e.g., 500 = 5.00%)
    mapping(uint256 => uint256) public shares; // basis points, 10000 = 100%

    // Total shares issued (for proportional distribution)
    uint256 public totalShares;

    // USDC token on Polygon
    IERC20 public usdc;

    // ─── Offering Terms ────────────────────────────────────────────────────────
    // All USD amounts are stored in cents (e.g. 5000 = $50.00)
    uint256 public minBuyAmountUSD;   // Minimum purchase in cents
    uint256 public totalOfferedBps;   // Total % of royalties on offer (basis pts)
    uint256 public offeringValueUSD;  // Total USD value of the full offering (cents)

    event CertificateMinted(address indexed to, uint256 tokenId, uint256 shareBps);
    event USDCDistributed(uint256 totalDistributed);
    event OfferingTermsSet(uint256 minBuyAmountUSD, uint256 totalOfferedBps, uint256 offeringValueUSD);

    constructor(address _usdcAddress)
        ERC721("BookRoyaltyCertificate", "ROYALTY")
        Ownable(msg.sender)
    {
        usdc = IERC20(_usdcAddress);
    }

    // ─── Admin: Set Offering Terms ─────────────────────────────────────────────
    /**
     * @notice Define the terms of this royalty offering.
     * @param _minBuyAmountUSD  Minimum purchase in cents (e.g. 5000 = $50.00)
     * @param _totalOfferedBps  Total % of royalties offered in basis points (e.g. 1000 = 10%)
     * @param _offeringValueUSD Total USD value of the full offering in cents (e.g. 500000 = $5,000)
     */
    function setOfferingTerms(
        uint256 _minBuyAmountUSD,
        uint256 _totalOfferedBps,
        uint256 _offeringValueUSD
    ) external onlyOwner {
        require(_minBuyAmountUSD > 0, "Min buy must be > 0");
        require(_totalOfferedBps > 0 && _totalOfferedBps <= 10000, "Invalid offered bps");
        require(_offeringValueUSD > 0, "Offering value must be > 0");
        require(_minBuyAmountUSD <= _offeringValueUSD, "Min buy exceeds offering value");

        minBuyAmountUSD   = _minBuyAmountUSD;
        totalOfferedBps   = _totalOfferedBps;
        offeringValueUSD  = _offeringValueUSD;

        emit OfferingTermsSet(_minBuyAmountUSD, _totalOfferedBps, _offeringValueUSD);
    }

    /**
     * @notice Read current offering terms.
     * @return minBuy   Minimum purchase in cents
     * @return offeredBps Total basis points on offer
     * @return offerValue Total offering value in cents
     */
    function getOfferingTerms() external view returns (
        uint256 minBuy,
        uint256 offeredBps,
        uint256 offerValue
    ) {
        return (minBuyAmountUSD, totalOfferedBps, offeringValueUSD);
    }

    // ─── Mint ──────────────────────────────────────────────────────────────────
    // Mint a new Royalty Certificate (called from backend after Stripe success)
    function mintCertificate(
        address to,
        string memory uri,
        uint256 shareBasisPoints
    ) external onlyOwner returns (uint256) {
        require(shareBasisPoints > 0 && shareBasisPoints <= 10000, "Invalid share");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);

        shares[newTokenId] = shareBasisPoints;
        totalShares += shareBasisPoints;

        emit CertificateMinted(to, newTokenId, shareBasisPoints);
        return newTokenId;
    }

    // ─── Distribute ────────────────────────────────────────────────────────────
    // Distribute USDC proportionally to all holders
    function distributeUSDC(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient USDC");

        uint256 tokenCount = _tokenIds;
        for (uint256 i = 1; i <= tokenCount; i++) {
            address owner = ownerOf(i);
            if (owner != address(0)) {
                uint256 payout = (amount * shares[i]) / totalShares;
                if (payout > 0) {
                    usdc.transfer(owner, payout);
                }
            }
        }

        emit USDCDistributed(amount);
    }

    // ─── Overrides ─────────────────────────────────────────────────────────────
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
