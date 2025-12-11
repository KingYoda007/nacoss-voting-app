const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const VotingSystem = await hre.ethers.getContractFactory("VotingSystem");

    // Attach to existing deployment (assuming localhost is running)
    // We need the address. We can read it from the config file we generated or just deploy fresh + seed.
    // Deploying fresh + seed is safer for a script unless we parse the file.
    // For simplicity in this demo, let's deploy a NEW one and update the config, 
    // OR we can try to attach if we knew the address. 
    // Let's go with: Deploy NEW -> Seed -> Update Config. This ensures clean state.

    console.log("Deploying new contract for seeding...");
    const votingSystem = await VotingSystem.deploy();
    await votingSystem.waitForDeployment();
    const address = await votingSystem.getAddress();
    console.log("Seeding data to contract at:", address);

    // Update Config
    const fs = require("fs");
    const path = require("path");
    const configPath = path.join(__dirname, "../src/utils/contract-config.js");
    fs.writeFileSync(configPath, `export const CONTRACT_ADDRESS = "${address}";\n`);

    // 1. Create Election
    const now = Math.floor(Date.now() / 1000);
    const oneDay = 86400;
    console.log("Creating Election: NACOSS General Elections 2024");
    await (await votingSystem.createElection("NACOSS General Elections 2024", now - 60, now + oneDay)).wait(); // Starts 1 min ago

    // 2. Add Positions (Election ID 1)
    console.log("Adding Position: President");
    await (await votingSystem.addPosition(1, "President")).wait();

    console.log("Adding Position: Director of Socials");
    await (await votingSystem.addPosition(1, "Director of Socials")).wait();

    // 3. Add Candidates
    // Position 1 (President)
    console.log("Adding Candidate: Sarah Connor (President)");
    await (await votingSystem.addCandidate(
        1, // Position ID
        "Sarah Connor",
        "Building a safer future for all students.",
        "https://ui-avatars.com/api/?name=Sarah+Connor&background=0D8ABC&color=fff&size=200"
    )).wait();

    console.log("Adding Candidate: John Wick (President)");
    await (await votingSystem.addCandidate(
        1,
        "John Wick",
        "Focus, Commitment, and Sheer Will.",
        "https://ui-avatars.com/api/?name=John+Wick&background=333&color=fff&size=200"
    )).wait();

    // Position 2 (Socials)
    console.log("Adding Candidate: Tony Stark (Socials)");
    await (await votingSystem.addCandidate(
        2,
        "Tony Stark",
        "Party at the Tower!",
        "https://ui-avatars.com/api/?name=Tony+Stark&background=FF5733&color=fff&size=200"
    )).wait();

    console.log("--- Seeding Complete ---");
    console.log("You can now refresh the React App to see the data.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
