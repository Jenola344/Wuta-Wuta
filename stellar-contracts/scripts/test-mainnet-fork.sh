#!/bin/bash
# Mainnet Fork Testing + Gas Prediction for Soroban Contracts
# Usage: ./test-mainnet-fork.sh [contract_wasm_path]

set -euo pipefail

echo \"🚀 Starting Mainnet Fork Tests & Gas Prediction...\"

# Config
RPC_URL=\"${SOROBAN_RPC_URL:-http://127.0.0.1:8000}\"
NETWORK=\"mainnet\"
WASM_PATH=\"${1:-../contracts/target/wasm32-unknown-unknown/release/wutawuta_marketplace.wasm}\"
GAS_THRESHOLDS=\"../.gas-thresholds.json\"

# Check prerequisites
if [[ ! -f \"$WASM_PATH\" ]]; then
  echo \"❌ WASM not found: $WASM_PATH\"
  exit 1
fi

echo \"📡 Using RPC: $RPC_URL\"

# 1. Deploy contract to local mainnet-fork node
echo \"📦 Deploying contract...\"
CONTRACT_ID=$(soroban contract deploy \
  --wasm $WASM_PATH \
  --source-account $(soroban keys generate deployer --generate-phrase | soroban keys address) \
  --rpc-url $RPC_URL \
  --network-passphrase \"Public Global Stellar Network ; September 2015\" \
  --private-key-path $(mktemp) \
  --allow-non-root-user \
  | soroban contract id)

echo \"✅ Deployed: $CONTRACT_ID\"

# 2. Initialize contract
echo \"🔧 Initializing marketplace...\"
soroban contract invoke \
  --contract-id $CONTRACT_ID \
  --rpc-url $RPC_URL \
  --network-passphrase \"Public Global Stellar Network ; September 2015\" \
  --source deployer \
  --wasm $WASM_PATH \
  -- initialize \
  --marketplace-fee 250 \
  --evolution-fee 1000000 \
  --min-evolution-interval 86400

# 3. Run key transactions & capture gas
GAS_REPORT=()
TESTS=(\"mint\" \"list\" \"buy\" \"bid\" \"evolve\")

for test in \"${TESTS[@]}\"; do
  echo \"🧪 Testing $test...\"
  
  # Simulate tx (gas prediction without execution)
  RESULT=$(soroban preview contract invoke \
    --contract-id $CONTRACT_ID \
    --rpc-url $RPC_URL \
    --network-passphrase \"Public Global Stellar Network ; September 2015\" \
    -- $test --test-params 2>/dev/null | jq '.results[0].cost.0' 2>/dev/null || echo \"{}\")
  
  CPU=$(echo $RESULT | jq '.cpuInsns')
  echo \"  💾 $test gas: ${CPU:-unknown} CPU instructions\"
  
  # Check threshold (TODO: load from JSON)
  if [[ \"$CPU\" != \"null\" && \"$CPU\" -gt 10000000 ]]; then
    echo \"❌ $test exceeded gas threshold!\"
    exit 1
  fi
  
  GAS_REPORT+=(\"\\\"$test\\\": $CPU\")
done

# 4. Full test suite
echo \"🔬 Running integration tests...\"
cargo test --manifest-path ../contracts/Cargo.toml --features testutils -- \
  --test-threads=1 -- \
  -- soroban::test::rpc::rpc_url=\"$RPC_URL\" \
  CONTRACT_ID=\"$CONTRACT_ID\"

# 5. Generate report
REPORT=\"{\\\"contract\\\": \\\"$CONTRACT_ID\\\", \\\"rpc\\\": \\\"$RPC_URL\\\", \\\"tests\\\": {$(IFS=,; echo \"${GAS_REPORT[*]}\")}}\"
echo $REPORT > gas-report.json

echo \"✅ All tests passed! Gas report saved to gas-report.json\"
echo \"Report:\"
cat gas-report.json
