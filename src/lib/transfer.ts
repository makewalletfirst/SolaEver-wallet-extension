import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  Keypair,
} from '@solana/web3.js';
import { connection, RPC_ENDPOINT } from './connection';

export async function sendSLE(
  sender: Keypair,
  toAddress: string,
  amount: number
): Promise<string> {
  const toPubkey = new PublicKey(toAddress);
  const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

  // 잔액 사전 확인 (수수료 ~5000 lamports 여유 포함) — 0 잔액에서도 "성공"으로 표시되던 버그 차단
  const bal = await connection.getBalance(sender.publicKey, 'processed');
  if (bal < lamports + 5000) {
    throw new Error(`잔액이 부족합니다 (보유 ${(bal / LAMPORTS_PER_SOL).toFixed(6)} SLE)`);
  }

  const { blockhash } = await connection.getLatestBlockhash('processed');
  const transaction = new Transaction({
    feePayer: sender.publicKey,
    recentBlockhash: blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey,
      lamports,
    })
  );

  const signature = await connection.sendTransaction(transaction, [sender], {
    skipPreflight: false,
    preflightCommitment: 'processed',
  });

  // confirm + on-chain err 검사 (preflight 통과해도 chain err 잡힘)
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

export async function getBalance(address: string): Promise<number> {
  try {
    const response = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address, { commitment: 'processed' }]
      }),
    });
    const json = await response.json();
    return json.result.value / LAMPORTS_PER_SOL;
  } catch (error: any) {
    return 0;
  }
}

/**
 * owner 의 native account 시그너처 + owner 의 모든 SPL token account 시그너처를
 * 합쳐 가져옴 (받은 SPL 트랜잭션도 잡히게). dedupe by signature, blockTime DESC.
 */
export async function getTransactionHistory(address: string) {
  try {
    const owner = new PublicKey(address);
    const SPL_TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const tokenAccs = await connection.getTokenAccountsByOwner(owner, { programId: SPL_TOKEN_PROGRAM })
      .catch(() => ({ value: [] as any[] }));

    const accounts = [owner, ...tokenAccs.value.map((x: any) => x.pubkey)];

    const lists = await Promise.all(
      accounts.map(acc =>
        connection.getSignaturesForAddress(acc, { limit: 25 }, 'confirmed').catch(() => [])
      )
    );

    const seen = new Set<string>();
    const merged: any[] = [];
    for (const list of lists) {
      for (const s of list) {
        if (!seen.has(s.signature)) {
          seen.add(s.signature);
          merged.push(s);
        }
      }
    }
    merged.sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0));
    return merged.slice(0, 50);
  } catch (error: any) {
    console.error("History fetch failed:", error);
    return [];
  }
}
