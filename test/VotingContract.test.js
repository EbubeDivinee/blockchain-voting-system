const VotingContract = artifacts.require("VotingContract");

contract("VotingContract", (accounts) => {
  const [owner, voter1, voter2, voter3, nonOwner] = accounts;

  let contract;

  beforeEach(async () => {
    contract = await VotingContract.new(); // Deploy a new instance before each test
  });

  // -------------------------------------------- Initialization Tests ------------------------------------------
  it("should set the owner upon deployment", async () => {
    const contractOwner = await contract.owner();
    assert.equal(contractOwner, owner, "Owner is not set correctly");
  });

  it("should initialize the phase to NotStarted", async () => {
    const phase = await contract.phase();
    assert.equal(phase.toString(), "0", "Initial phase is not NotStarted");
  });

  // -------------------------------------------- Phase Transition Tests ----------------------------------------
  it("should allow only sequential phase transitions", async () => {
    await contract.setPhase(1, { from: owner }); // NotStarted → Registration
    let phase = await contract.phase();
    assert.equal(phase.toString(), "1", "Phase did not transition to Registration");

    await contract.setPhase(2, { from: owner }); // Registration → Voting
    phase = await contract.phase();
    assert.equal(phase.toString(), "2", "Phase did not transition to Voting");

    await contract.setPhase(3, { from: owner }); // Voting → Ended
    phase = await contract.phase();
    assert.equal(phase.toString(), "3", "Phase did not transition to Ended");

    try {
      await contract.setPhase(1, { from: owner }); // Invalid rollback attempt
      assert.fail("Should not allow rollback to a previous phase");
    } catch (err) {
      assert.include(err.message, "Phases must transition sequentially");
    }
  });

  it("should not allow non-owner to set phase", async () => {
    try {
      await contract.setPhase(1, { from: nonOwner });
      assert.fail("Non-owner should not be allowed to set phase");
    } catch (err) {
      assert.include(err.message, "You are not the owner");
    }
  });



  // -------------------------------------------- Candidate Registration Tests ----------------------------------
  it("should allow owner to add candidates during Registration phase", async () => {
    await contract.setPhase(1, { from: owner }); // Move to Registration phase
    await contract.addCandidate("Candidate 1", { from: owner });
    const candidateName = await contract.candidates(1);
    assert.equal(candidateName, "Candidate 1", "Candidate registration failed");
  });

  it("should not allow duplicate candidate names", async () => {
    await contract.setPhase(1, { from: owner }); // Move to Registration phase
    await contract.addCandidate("Candidate 1", { from: owner });

    try {
      await contract.addCandidate("Candidate 1", { from: owner });
      assert.fail("Duplicate candidate names should not be allowed");
    } catch (err) {
      assert.include(err.message, "Candidate name already exists");
    }
  });

  it("should not allow adding candidates outside Registration phase", async () => {
    try {
      await contract.addCandidate("Candidate 1", { from: owner }); // No phase transition
      assert.fail("Candidate registration should not be allowed outside Registration phase");
    } catch (err) {
      assert.include(err.message, "Invalid phase for this action");
    }
  });

   // -------------------------------------------- Write-In Candidate Tests -------------------------------------
   it("should allow owner to approve write-in candidates during Registration phase", async () => {
    await contract.setPhase(1, { from: owner }); // Move to Registration phase
    await contract.approveWriteIn("WriteIn 1", { from: owner });
    const nameHash = web3.utils.keccak256("WriteIn 1");
    const isApproved = await contract.approvedWriteIns(nameHash);
    assert.isTrue(isApproved, "Write-in candidate approval failed");
  });

  it("should not allow duplicate write-in candidates", async () => {
    await contract.setPhase(1, { from: owner }); // Move to Registration phase
    await contract.approveWriteIn("WriteIn 1", { from: owner });

    try {
      await contract.approveWriteIn("WriteIn 1", { from: owner });
      assert.fail("Duplicate write-in candidates should not be allowed");
    } catch (err) {
      assert.include(err.message, "Write-in candidate already approved");
    }
  });

  it("should not allow approving write-ins outside Registration phase", async () => {
    try {
      await contract.approveWriteIn("WriteIn 1", { from: owner }); // No phase transition
      assert.fail("Write-in approval should not be allowed outside Registration phase");
    } catch (err) {
      assert.include(err.message, "Invalid phase for this action");
    }
  });

  // -------------------------------------------- Voting Tests ----------------------------------------------------
  // Tests for the voting process, including ensuring voters cannot vote multiple times and results accuracy.
  it("should allow registered voters to cast votes during Voting phase", async () => {
    await contract.setPhase(1, { from: owner }); // Move to Registration phase
    await contract.registerVoter(voter1, { from: owner });
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.setPhase(2, { from: owner }); // Move to Voting phase

    await contract.castVote(1, { from: voter1 });
    const hasVoted = await contract.hasVoted(voter1);
    assert.isTrue(hasVoted, "Voting failed");
  });

  it("should not allow unregistered voters to cast votes", async () => {
    await contract.setPhase(1, { from: owner }); // Move to Registration phase
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.setPhase(2, { from: owner }); // Move to Voting phase

    try {
      await contract.castVote(1, { from: voter2 });
      assert.fail("Unregistered voters should not be allowed to cast votes");
    } catch (err) {
      assert.include(err.message, "You are not a registered voter");
    }
  });

  it("should not allow voting for invalid candidate IDs", async () => {
    await contract.setPhase(1, { from: owner }); // Registration phase
    await contract.registerVoter(voter1, { from: owner });
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.startElection({ from: owner });
  
    try {
      await contract.castVote(99, { from: voter1 });
      assert.fail("Voting for invalid candidate IDs should not be allowed");
    } catch (err) {
      assert.include(err.message, "Invalid candidate ID", "Error message mismatch");
    }
  });  

  it("should not allow double voting", async () => {
    await contract.setPhase(1, { from: owner }); // Registration phase
    await contract.registerVoter(voter1, { from: owner });
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.startElection({ from: owner }); // Properly start the election

    // Log initial voter status
    const hasVotedBefore = await contract.hasVoted(voter1);
    console.log("Has Voter1 Voted (Before):", hasVotedBefore);
    
    await contract.castVote(1, { from: voter1 }); // First vote

     // Log voter status after first vote
     const hasVotedAfter = await contract.hasVoted(voter1);
     console.log("Has Voter1 Voted (After First Vote):", hasVotedAfter); 

    try {
      await contract.castVote(1, { from: voter1 });
      assert.fail("Double voting should not be allowed");
    } catch (err) {
      console.log("Error Message:", err.message);
      assert.include(err.message, "You have already voted", "Incorrect error message for double voting");
    }
  });

  // -------------------------------------------- Election Results Tests ---------------------------------------

  it("should retrieve accurate election results", async () => {
    await contract.setPhase(1, { from: owner }); // Registration phase
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.addCandidate("Candidate 2", { from: owner });
    await contract.registerVoter(voter1, { from: owner });
    await contract.registerVoter(voter2, { from: owner });
    await contract.startElection({ from: owner }); // Start election
    await contract.castVote(1, { from: voter1 });
    await contract.castVote(2, { from: voter2 });
    await contract.endElection({ from: owner }); // End election

    const results = await contract.getAllResults();
    const candidateNames = results[0];
    const voteCounts = results[1];
  
    assert.equal(candidateNames[0], "Candidate 1", "Candidate 1 name is incorrect");
    assert.equal(voteCounts[0].toString(), "1", "Candidate 1 votes are incorrect");
    assert.equal(candidateNames[1], "Candidate 2", "Candidate 2 name is incorrect");
    assert.equal(voteCounts[1].toString(), "1", "Candidate 2 votes are incorrect");
  });  

  // -------------------------------------------- Edge Case Tests ------------------------------------------------
  // Tests to ensure robustness for unexpected or invalid inputs, such as invalid candidate IDs or phase transitions.
  it("should not allow voting before the election starts", async () => {
    try {
        await contract.castVote(1, { from: voter1 }); // Use the local `contract`
        assert.fail("Voting should not be allowed before the election starts");
    } catch (err) {
      assert.include(err.message, "Invalid phase for this action");
    }
  });

  it("should not allow voting after the election ends", async () => {
    await contract.setPhase(1, { from: owner }); // Registration phase
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.registerVoter(voter1, { from: owner });
    await contract.startElection({ from: owner }); // Start election
    await contract.castVote(1, { from: voter1 });
    await contract.endElection({ from: owner }); // End election
  
    try {
      await contract.castVote(1, { from: voter2 });
      assert.fail("Voting should not be allowed after the election ends");
    } catch (err) {
      assert.include(err.message, "Invalid phase for this action");
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
        assert.include(err.message, "Invalid phase for this action");
    }
  });

  it("should not allow retrieving results before the election ends", async () => {
    await contract.setPhase(1, { from: owner }); // Registration phase
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.startElection({ from: owner }); 
  
    try {
      const phase = await contract.phase();
      console.log("Current phase:", phase.toString()); // 2 should indicate Voting
      await contract.getAllResults();
      assert.fail("Retrieving results before the election ends should not be allowed");
    } catch (err) {
      assert.include(err.message, "Invalid phase for this action");
    }
  });  

  // -------------------------------------------- Security Tests --------------------------------------------------
  // Tests to verify access controls, such as ensuring only the owner can change phases or manage the election.

  it("should only allow the owner to start the election", async () => {
    await contract.setPhase(1); // Move to Registration Phase
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.startElection({ from: owner });
    const phase = await contract.phase();
    assert.equal(phase.toString(), "2", "Election was not started correctly");
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

  it("should not allow non-owner to change the election phase", async () => {
    try {
      await contract.setPhase(1, { from: nonOwner }); // Non-owner attempts to change the phase
      assert.fail("Non-owner should not be allowed to change the election phase");
    } catch (err) {
      assert.include(err.message, "You are not the owner", "Error message mismatch");
    }
  });

  // -------------------------------------------- Gas Optimization Tests ------------------------------------------
  // Tests to analyze and validate gas efficiency for critical operations.
  it("should have reasonable gas usage for casting a vote", async () => {
    await contract.setPhase(1, { from: owner }); // Registration phase
    await contract.addCandidate("Candidate 1", { from: owner });
    await contract.registerVoter(voter1, { from: owner });
    await contract.setPhase(2, { from: owner }); // Voting phase
  
    const tx = await contract.castVote(1, { from: voter1 });
    const gasUsed = tx.receipt.gasUsed;
  
    console.log("Gas used for casting a vote:", gasUsed);
    assert.isBelow(gasUsed, 100000, "Gas usage for casting a vote is too high");
  });  
});
