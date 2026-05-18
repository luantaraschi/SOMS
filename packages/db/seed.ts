// Sprint 1 seed: 10 tracks de teste pra rodar partidas locais.
//
// ESTADO: estrutura tipada, pronta. A população das URLs e a execução do
// createMany ficam para A4 — quando docker-compose já estiver de pé e o
// schema migrado. Razão: HEAD check de cada previewUrl precisa de rede.
//
// Em A4:
//   1. Popular `tracks[]` com 10 entradas Deezer pré-validadas
//      (≥3 gêneros, ≥2 décadas, mistura BR + internacional).
//   2. Antes de gravar cada entrada: HEAD request em previewUrl, exigir 200.
//   3. Descomentar o bloco createMany em main().
//   4. Rodar `pnpm --filter @soms/db db:seed`.

type TrackSeed = {
  provider: string;
  providerTrackId: string;
  title: string;
  artists: string[];
  feats: string[];
  album: string | null;
  coverUrl: string | null;
  previewUrl: string | null;
  duration: number | null;
  releaseYear: number | null;
  genres: string[];
  decade: number | null;
};

const tracks: TrackSeed[] = [
  // TODO(A4): popular com 10 tracks Deezer pré-validadas (HEAD 200 em previewUrl).
  //
  // Exemplo de entrada (placeholder — não usar):
  // {
  //   provider: 'deezer',
  //   providerTrackId: '3135556',
  //   title: 'Harder, Better, Faster, Stronger',
  //   artists: ['Daft Punk'],
  //   feats: [],
  //   album: 'Discovery',
  //   coverUrl: 'https://e-cdn-images.dzcdn.net/images/cover/<hash>/500x500.jpg',
  //   previewUrl: 'https://cdns-preview-X.dzcdn.net/stream/c-<hash>.mp3',
  //   duration: 30,
  //   releaseYear: 2001,
  //   genres: ['electronic'],
  //   decade: 2000,
  // },
];

async function main(): Promise<void> {
  // TODO(A4): descomentar depois que tracks[] estiver populado e o DB estiver up.
  //
  // const { prisma } = await import('./src/index.js');
  // const result = await prisma.track.createMany({
  //   data: tracks,
  //   skipDuplicates: true,
  // });
  // console.log(`[seed] inseriu ${result.count} tracks (duplicatas ignoradas)`);
  // await prisma.$disconnect();

  console.log(
    `[seed] estrutura pronta. tracks.length=${tracks.length}. ` +
      `Em A4: popular o array, descomentar createMany, rodar pnpm db:seed.`,
  );
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
