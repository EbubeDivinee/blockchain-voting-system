// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Blockchain Voting System Interface
/// @dev This is the interface of the voting system smart contract
interface IVotingSystem {
    // Events
    event VoterRegistered(address voter);
    event VoteCasted(address voter, uint candidateId);
    event ElectionStarted();
    event ElectionEnded();

    // Functions
    function registerVoter(address _voter) external;
    function startElection() external;
    function castVote(uint _candidateId) external;
    function endElection() external;
    function viewResults() external view returns (uint[] memory);
}
