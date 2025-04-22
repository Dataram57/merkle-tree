
//================================================================
//#region Functions

const Hash = async (a,b) => {
    const encoder = new TextEncoder();
    let message = "";
    if(b > a)
        message = b + a;
    else
        message = a + b;
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

const Trim = message => message.length > 4 ? message.substring(0, 4) + "..." : message;

const GenerateLeaves = async (secret, salt, depth) => {
    leaves = [];
    lastHash = secret;
    for(depth = 2 ** depth; depth > 0; depth--){
        lastHash = await Hash(lastHash + salt);
        leaves.push(lastHash);
    }
    return leaves;
};

const BuildMerkleTree = async (values, targetIndex = null, currentStart = 0) => {
    if (values.length === 1) {
        const node = document.createElement('div');
        node.className = 'node';

        const header = document.createElement('header');
        const div = document.createElement('div');
        div.textContent = Trim(values[0]);
        header.appendChild(div);
        node.appendChild(header);

        // Highlight target leaf
        if (targetIndex !== null && currentStart === targetIndex) {
            node.classList.add('highlight');
        }

        return { hash: values[0], element: node, containsTarget: currentStart === targetIndex };
    }

    // Split values into two halves
    const mid = Math.ceil(values.length / 2);
    const leftSubtree = await BuildMerkleTree(values.slice(0, mid), targetIndex, currentStart);
    const rightSubtree = await BuildMerkleTree(values.slice(mid), targetIndex, currentStart + mid);

    // Combine hashes
    const combinedHash = await Hash(leftSubtree.hash, rightSubtree.hash);

    // Create parent node
    const parentNode = document.createElement('div');
    parentNode.className = 'node';

    const header = document.createElement('header');
    const div = document.createElement('div');
    div.textContent = Trim(combinedHash);
    header.appendChild(div);
    parentNode.appendChild(header);

    // Append left and right subtrees
    parentNode.appendChild(leftSubtree.element);
    parentNode.appendChild(rightSubtree.element);

    // Highlight path and neighbour nodes
    if (leftSubtree.containsTarget || rightSubtree.containsTarget) {
        parentNode.classList.add('highlight');

        if (leftSubtree.containsTarget) {
            // Mark right sibling as neighbour
            rightSubtree.element.classList.add('neighbour');
        } else {
            // Mark left sibling as neighbour
            leftSubtree.element.classList.add('neighbour');
        }
    }

    return {
        hash: combinedHash,
        element: parentNode,
        containsTarget: leftSubtree.containsTarget || rightSubtree.containsTarget
    };
};

const RenderTree = async () => {
    //consts
    const graph = document.getElementById("graph");
    const secret = document.getElementById("challenge_secret").value;
    const salt = document.getElementById("challenge_salt").value;
    const depth = document.getElementById("challenge_depth").value;
    
    //path
    let i = document.getElementById("proof_index").value;
    if((i <= 0) || i > (2**depth))
        i = undefined;
    else
        i--;

    //generate leaves
    const leaves = await GenerateLeaves(secret, salt, depth);

    //render
    graph.innerHTML = "";
    graph.appendChild((await BuildMerkleTree(leaves,i)).element);
};

const GenerateMerkleProof = async (leaves, targetIndex) => {
    let proof = [];
    let currentLayer = [...leaves];  // clone the leaves array

    while (currentLayer.length > 1) {
        const nextLayer = [];
        const isRightNode = targetIndex % 2;
        const pairIndex = isRightNode ? targetIndex - 1 : targetIndex + 1;

        // Add neighbour hash (if exists) to proof
        if (pairIndex < currentLayer.length) {
            proof.push(currentLayer[pairIndex]);
        } else {
            // If no pair, duplicate this node's own hash
            proof.push(currentLayer[targetIndex]);
        }

        // Build next layer by hashing pairs
        for (let i = 0; i < currentLayer.length; i += 2) {
            const left = currentLayer[i];
            const right = (i + 1 < currentLayer.length) ? currentLayer[i + 1] : left;
            nextLayer.push(await Hash(left, right));
        }

        // Move up to next layer
        targetIndex = Math.floor(targetIndex / 2);
        currentLayer = nextLayer;
    }

    // Add Merkle root as the last item
    proof.push(currentLayer[0]);

    return proof;
};

//#endregion

//================================================================
//#region Buttons

const CreateChallenge = () => {
    //correct proof_index input
    document.getElementById("proof_index").value = 0;
    document.getElementById("proof_index").max = 2 ** document.getElementById("challenge_depth").value;

    //render
    RenderTree();
};

const CreateProof = async () => {
    //consts
    const secret = document.getElementById("challenge_secret").value;
    const salt = document.getElementById("challenge_salt").value;
    const depth = document.getElementById("challenge_depth").value;
    
    //path
    let i = document.getElementById("proof_index").value;
    if((i <= 0) || i > (2**depth))
        i = undefined;
    else
        i--;

    //create proof
    const leaves = await GenerateLeaves(secret, salt, depth);
    const proof = await GenerateMerkleProof(leaves, i);
    const root = proof.pop();

    //update textarea
    let txt = "Merkle Root:"
    txt += "\n" + root;
    txt += "\n\nSalt:"
    txt += "\n" + salt;
    txt += "\n\nHashes (Proof):\n";
    let txt2 = leaves[i];
    for(i = 0; i < proof.length; i++){
        txt2 += "\n" + proof[i];
    }
    document.getElementById("proof_output").value = txt + txt2;

    //autocomplete verify
    document.getElementById("verify_root").value = root;
    document.getElementById("verify_salt").value = salt;
    document.getElementById("verify_proof").value = txt2;

    //render
    await RenderTree();
};

const VerifyProof = async () => {
    //get data
    const root = document.getElementById("verify_root").value;
    const salt = document.getElementById("verify_salt").value;
    const proof = document.getElementById("verify_proof").value.split('\n')                      // split into lines
    .map(line => line.trim())         // trim whitespace
    .filter(line => line.length > 0); // remove empty lines

    //hash loop
    let lastHash = proof[0];
    for(let i = 1; i < proof.length; i++){
        lastHash = await Hash(lastHash, proof[i]);
    }
    
    //check end hash
    document.getElementById("verify_result").innerHTML = (lastHash == root) ? "Correct ✔️" : "Fake ❌";
};

//#endregion

//================================================================
//#region Main
window.onload = () =>{
};

//#endregion
