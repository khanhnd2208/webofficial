#!/usr/bin/env bash
# One-time SSH key setup for VPS deploy (password used once, never stored in repo).
#
# Usage:
#   VPS_PASSWORD='your-password' ./scripts/setup-vps-ssh.sh
#
# After success, deploy with: ./scripts/deploy-vps.sh

set -euo pipefail

VPS_IP="${VPS_IP:-217.217.253.161}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/id_ed25519}"

if [[ ! -f "$KEY" ]]; then
	ssh-keygen -t ed25519 -f "$KEY" -N "" -C "cursor-deploy-webofficial"
fi

if ssh -o BatchMode=yes -o ConnectTimeout=8 -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "echo ok" &>/dev/null; then
	echo "✅ SSH key auth already works for $VPS_USER@$VPS_IP"
	exit 0
fi

if [[ -z "${VPS_PASSWORD:-}" ]]; then
	echo "Set VPS_PASSWORD for one-time key install, or add your public key manually:"
	echo "  ssh-copy-id -i ${KEY}.pub -p $VPS_PORT $VPS_USER@$VPS_IP"
	exit 1
fi

if ! command -v sshpass &>/dev/null; then
	echo "Install sshpass: brew install sshpass"
	exit 1
fi

sshpass -p "$VPS_PASSWORD" ssh-copy-id -i "${KEY}.pub" -p "$VPS_PORT" -o StrictHostKeyChecking=accept-new "$VPS_USER@$VPS_IP"
echo "✅ Public key installed. Test: ssh -p $VPS_PORT $VPS_USER@$VPS_IP hostname"
