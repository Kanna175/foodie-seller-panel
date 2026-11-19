import Logo from './Logo';

export default function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <div className="animate-fade-up">
        <Logo size={140} withWordmark />
      </div>
    </div>
  );
}
