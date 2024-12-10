const VotingContract = artifacts.require("VotingContract");

contract("VotingContract", (accounts) => {
  const [owner, voter1, voter2, nonOwner] = accounts;

  it("should set the owner upon deployment", async () => {
    const contract = await VotingContract.new();
    const contractOwner = await contract.owner();
    assert.equal(contractOwner, owner, "Owner is not set correctly");
  });

  it("should allow the owner to add a candidate", async () => {
    const contract = await VotingContract.new();
    await contract.setPhase(1); // Move to Registration Phase
    await contract.addCandidate("Candidate 1", { from: owner });
    const candidateName = await contract.candidates(1);
    assert.equal(candidateName, "Candidate 1", "Candidate was not added correctly");
  });

  it("should only allow the owner to start the election", async () => {
    const contract = await VotingContract.new();
    await contract.setPhase(1); // Move to Registration Phase
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.startElection({ from: owner });
    const phase = await contract.phase();
    assert.equal(phase.toString(), "2", "Election was not started correctly");
  });

  it("should allow a voter to cast a vote", async () => {
    const contract = await VotingContract.new();
    await contract.setPhase(1); // Move to Registration Phase
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.startElection({ from: owner });
    await contract.castVote(1, { from: voter1 });
    const hasVoted = await contract.hasVoted(voter1);
    const votes = await contract.votes(1);
    assert.isTrue(hasVoted, "Voter has not been marked as voted");
    assert.equal(votes.toString(), "1", "Vote was not recorded correctly");
  });

  it("should not allow double voting", async () => {
    const contract = await VotingContract.new();
    await contract.setPhase(1); // Move to Registration Phase
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.startElection({ from: owner });
    await contract.castVote(1, { from: voter1 });
    try {
      await contract.castVote(1, { from: voter1 });
      assert.fail("Double voting should not be allowed");
    } catch (err) {
      assert.include(err.message, "You have already voted", "Incorrect error message for double voting");
    }
  });

  it("should retrieve accurate election results", async () => {
    const contract = await VotingContract.new();
    await contract.setPhase(1); // Move to Registration Phase
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.addCandidate("Candidate 2", { from: owner });
    await contract.startElection({ from: owner });

    await contract.castVote(1, { from: voter1 });
    await contract.castVote(2, { from: voter2 });

    await contract.endElection({ from: owner });

    const results = await contract.getAllResults();
    const candidateNames = results[0];
    const voteCounts = results[1];

    assert.equal(candidateNames[0], "Candidate 1", "Candidate 1 name is incorrect");
    assert.equal(voteCounts[0].toString(), "1", "Candidate 1 votes are incorrect");
    assert.equal(candidateNames[1], "Candidate 2", "Candidate 2 name is incorrect");
    assert.equal(voteCounts[1].toString(), "1", "Candidate 2 votes are incorrect");
  });

  let contract;

  beforeEach(async () => {
  contract = await VotingContract.new(); // Deploy a new instance for each test
  });

  // Edge Case tests
  it("should not allow voting before the election starts", async () => {
    try {
        await contract.castVote(1, { from: voter1 }); // Use the local `contract`
        assert.fail("Voting should not be allowed before the election starts");
    } catch (err) {
        assert.include(err.message, "Election is not ongoing", "Error message mismatch");
    }
  });

  it("should not allow adding a candidate during an active election", async () => {
    await contract.setPhase(1); // Move to Registration Phase
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.startElection({ from: owner });
    try {
        await contract.addCandidate("Candidate 2", { from: owner });
        assert.fail("Adding candidates during an active election should not be allowed");
    } catch (err) {
        assert.include(err.message, "Cannot add candidates during an election", "Error message mismatch");
    }
  });

  it("should not allow retrieving results before the election ends", async () => {
    await contract.setPhase(1); // Move to Registration Phase
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.startElection({ from: owner });
    try {
        await contract.getAllResults();
        assert.fail("Retrieving results before the election ends should not be allowed");
    } catch (err) {
        assert.include(err.message, "Invalid phase", "Error message mismatch");
    }
  });

  it("should not allow voting with an invalid candidate ID", async () => {
    await contract.setPhase(1); // Move to Registration Phase
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.startElection({ from: owner });
    try {
        await contract.castVote(99, { from: voter1 }); // Invalid ID
        assert.fail("Voting for an invalid candidate ID should not be allowed");
    } catch (err) {
        assert.include(err.message, "Invalid candidate ID", "Error message mismatch");
    }
  });

  it("should not allow non-owner to start or end the election", async () => {
    await contract.setPhase(1); // Move to Registration Phase
    await contract.addCandidate("Candidate 1", { from: owner });
    try {
        await contract.startElection({ from: nonOwner });
        assert.fail("Non-owner should not be allowed to start the election");
    } catch (err) {
        assert.include(err.message, "You are not the owner", "Error message mismatch");
    }

    await contract.startElection({ from: owner });
    try {
        await contract.endElection({ from: nonOwner });
        assert.fail("Non-owner should not be allowed to end the election");
    } catch (err) {
        assert.include(err.message, "You are not the owner", "Error message mismatch");
    }
  });
});
