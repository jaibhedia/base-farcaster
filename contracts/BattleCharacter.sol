// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BattleCharacter
 * @dev NFT contract for battle game characters with stats
 */
contract BattleCharacter is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    // Character types: 1=Fire, 2=Ice, 3=Spider, 4=Fart, 5=Stone, 6=Punch, 7=Jelly, 8=Electro
    struct CharacterStats {
        uint8 characterType;
        uint16 wins;
        uint16 losses;
        uint32 totalDamageDealt;
        uint256 mintedAt;
    }
    
    mapping(uint256 => CharacterStats) public characterStats;
    mapping(address => uint256) public playerWins;
    mapping(address => uint256) public playerScore;
    
    event CharacterMinted(uint256 indexed tokenId, address indexed winner, uint8 characterType);
    event BattleRecorded(uint256 indexed tokenId, bool won, uint32 damageDealt);
    
    constructor() ERC721("Battle Character", "BATTLE") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new character NFT to battle winner
     */
    function mintToWinner(address winner, uint8 characterType) external onlyOwner returns (uint256) {
        require(characterType >= 1 && characterType <= 8, "Invalid character type");
        
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(winner, tokenId);
        
        characterStats[tokenId] = CharacterStats({
            characterType: characterType,
            wins: 0,
            losses: 0,
            totalDamageDealt: 0,
            mintedAt: block.timestamp
        });
        
        playerWins[winner]++;
        playerScore[winner] += 100; // Base score for winning
        
        emit CharacterMinted(tokenId, winner, characterType);
        return tokenId;
    }
    
    /**
     * @dev Record battle results for a character
     */
    function recordBattle(uint256 tokenId, bool won, uint32 damageDealt) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        CharacterStats storage stats = characterStats[tokenId];
        if (won) {
            stats.wins++;
        } else {
            stats.losses++;
        }
        stats.totalDamageDealt += damageDealt;
        
        emit BattleRecorded(tokenId, won, damageDealt);
    }
    
    /**
     * @dev Get character details
     */
    function getCharacter(uint256 tokenId) external view returns (CharacterStats memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return characterStats[tokenId];
    }
    
    /**
     * @dev Get player's total wins
     */
    function getPlayerWins(address player) external view returns (uint256) {
        return playerWins[player];
    }
    
    /**
     * @dev Get player's score for leaderboard
     */
    function getPlayerScore(address player) external view returns (uint256) {
        return playerScore[player];
    }
    
    /**
     * @dev Get total characters minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
