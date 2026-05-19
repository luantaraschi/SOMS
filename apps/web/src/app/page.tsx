export default function HomePage(): React.ReactElement {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 paper">
      <div className="text-center">
        <h1 className="t-display">SOMS</h1>
        <p className="t-slogan mt-2">todo mundo acha que sabe.</p>
        <p className="t-caption mt-8">
          em construção. veja <a href="/test-design" className="underline">/test-design</a> pra
          conferir o design system.
        </p>
      </div>
    </main>
  );
}
