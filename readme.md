# Simple Merkle Proofer and Verifier.

Demo: [https://dataram57.github.io/merkle-tree/](https://dataram57.github.io/merkle-tree/)

# Math

### Hash function - $H\left(a,...\right)$

$$H\left(a\right)=H_{sha256}\left(a\right)$$

$$H\left(a,b\right)=...$$

When $b > a$ then $H\left(a,b\right)=H_{sha256}\left(b+a\right)$, else $H\left(a,b\right)=H_{sha256}\left(a+b\right)$

- $H_{sha256}\left(a\right)$ - `sha256` function

### Leaves - $L\left(i\right)$

$$s'=H\left(s+d\right)$$

$$L_{0}=H\left(S+s'\right)$$

$$L_{i}=H\left(L_{i-1}+s'\right)$$

- $S$ - secret
- $s$ - salt.
- $d$ - depth.

### Node value - $v$

$$v=H\left(l,r\right)$$

- $l$ - value of the left node.
- $r$ - value of the right node.

### Verification

$$i \in \langle 1,n-1 \rangle$$

$$P_{1}=H\left(H_{0},H_{i}\right)$$

$$P_{i}=H\left(P\left(i-1\right),H_{i}\right)$$

Proof is legit if $P_{n-1}=M$, else it's fake.

- $n$ - Number of hashes.
- - Alternative: $n = d + 1$.
- $M$ - Merkle root. 
