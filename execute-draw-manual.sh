#!/bin/bash

# Manual script to execute a draw when the cron fails
# This uses the owner wallet which should have permissions

CONTRACT_ADDRESS="0x10BDCcC3EB9d53FFA48F9F0360F495AB54b78FE5"
RPC_URL="https://base-mainnet.g.alchemy.com/v2/qRGYsr1605ww6yfIxEFww"

echo "🎲 Executing draw manually..."
echo "Contract: $CONTRACT_ADDRESS"
echo ""

# Execute the draw
cast send $CONTRACT_ADDRESS \
  "executeDraw()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 500000

echo ""
echo "✅ Draw executed! Check the transaction above."
