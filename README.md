# Blockchain Voting System
A smart contract for a transparent and secure blockchain-based voting system

## Group Members
- Oluebube Onwuamaegbu (oluebubeonwuamaegbu@gmail.com)

## Purpose
This project aims to create a transparent, secure, and tamper-proof voting system using blockchain technology. The system will enable voter registration, secure voting, and transparent result auditing.

## Contract Interface
### Functions
- `registerVoter(address _voter) public`
- `startElection() public`
- `castVote(uint _candidateId) public`
- `endElection() public`
- `viewResults() public view returns (uint[] memory)`

### Events
- `event VoterRegistered(address voter)`
- `event VoteCasted(address voter, uint candidateId)`
- `event ElectionStarted()`
- `event ElectionEnded()`
