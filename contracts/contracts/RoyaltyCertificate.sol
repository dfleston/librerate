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

    event CertificateMinted(address indexed to, uint256 tokenId, uint256 shareBps);
    event USDCDistributed(uint256 totalDistributed);

    constructor(address _usdcAddress) 
        ERC721("BookRoyaltyCertificate", "ROYALTY") 
        Ownable(msg.sender) 
    {
        usdc = IERC20(_usdcAddress);
    }

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

    // Distribute USDC proportionally to all holders
    function distributeUSDC(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient USDC");

        uint256 tokenCount = _tokenIds;
        for (uint256 i = 1; i <= tokenCount; i++) {
            address owner = ownerOf(i);
            if (owner != address(0)) { // valid token
                uint256 payout = (amount * shares[i]) / totalShares;
                if (payout > 0) {
                    usdc.transfer(owner, payout);
                }
            }
        }

        emit USDCDistributed(amount);
    }

    // Standard overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
