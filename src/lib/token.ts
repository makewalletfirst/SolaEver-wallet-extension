import {
  PublicKey,
  Transaction,
  Keypair
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getMint
} from '@solana/spl-token';
import { connection } from './connection';

// 기본 토큰 제거 (사용자가 직접 추가하도록 함)
export const COMMON_TOKENS: Record<string, { symbol: string, name: string, image?: string }> = {};

export function getTokenInfo(mint: string) {
  return COMMON_TOKENS[mint] || { symbol: "TOKEN", name: "Unknown Token" };
}

export async function getTokenBalance(mintAddress: string, ownerAddress: string): Promise<number> {
  try {
    const mint = new PublicKey(mintAddress);
    const owner = new PublicKey(ownerAddress);
    const response = await connection.getTokenAccountsByOwner(owner, { mint });
    if (response.value.length === 0) return 0;
    const balanceInfo = await connection.getTokenAccountBalance(response.value[0].pubkey, 'processed');
    return balanceInfo.value.uiAmount || 0;
  } catch (error) {
    return 0;
  }
}

export async function sendSPLToken(
  sender: Keypair,
  mintAddress: string,
  toAddress: string,
  amount: number
): Promise<string> {
  const mint = new PublicKey(mintAddress);
  const toPubkey = new PublicKey(toAddress);

  const mintInfo = await getMint(connection, mint, 'processed');
  const rawAmount = BigInt(Math.floor(amount * Math.pow(10, mintInfo.decimals)));

  // ── 1) sender 의 진짜 source token account 결정 ──
  //   SolaEver 의 ATA 호환 이슈 (spltoken.py 등이 keypair 기반 비-ATA 계정으로 발행)
  //   owner 의 모든 token account 중 잔액 가장 많은 것 사용.
  const senderAccs = await connection.getTokenAccountsByOwner(sender.publicKey, { mint });
  if (senderAccs.value.length === 0) {
    throw new Error('이 토큰을 보유하고 있지 않습니다 (token account 없음).');
  }
  let sourceAcc = senderAccs.value[0].pubkey;
  let sourceBal = 0n;
  for (const a of senderAccs.value) {
    const b = await connection.getTokenAccountBalance(a.pubkey, 'processed');
    const r = BigInt(b.value.amount);
    if (r > sourceBal) { sourceBal = r; sourceAcc = a.pubkey; }
  }
  if (sourceBal < rawAmount) {
    throw new Error(`잔액이 부족합니다 (보유 ${Number(sourceBal) / Math.pow(10, mintInfo.decimals)}).`);
  }

  // ── 2) recipient 의 destination token account 결정 ──
  //   recipient 가 이미 갖고 있는 token account 가 있으면 그걸 사용,
  //   없으면 ATA 자동 생성 시도.
  const recipAccs = await connection.getTokenAccountsByOwner(toPubkey, { mint });
  let destAcc;
  if (recipAccs.value.length > 0) {
    destAcc = recipAccs.value[0].pubkey;
  } else {
    try {
      const ata = await getOrCreateAssociatedTokenAccount(connection, sender, mint, toPubkey, false, 'processed');
      destAcc = ata.address;
    } catch (e: any) {
      throw new Error(`받는 사람의 token account 가 없고 자동 생성도 실패: ${e?.message || String(e)}`);
    }
  }

  const { blockhash } = await connection.getLatestBlockhash('processed');
  const transaction = new Transaction({
    feePayer: sender.publicKey,
    recentBlockhash: blockhash,
  }).add(
    createTransferInstruction(sourceAcc, destAcc, sender.publicKey, rawAmount)
  );

  const signature = await connection.sendTransaction(transaction, [sender], {
    skipPreflight: false,
    preflightCommitment: 'processed',
  });

  // confirm + on-chain err 검사 (0 잔액 "성공" 버그 차단)
  for (let i = 0; i < 15; i++) {
    const status = await connection.getSignatureStatus(signature);
    const v = status.value;
    if (v && (v.confirmationStatus === 'processed' || v.confirmationStatus === 'confirmed' || v.confirmationStatus === 'finalized')) {
      if (v.err) throw new Error(`트랜잭션 실패 (on-chain): ${JSON.stringify(v.err)}`);
      return signature;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('트랜잭션 확인 시간 초과');
}
