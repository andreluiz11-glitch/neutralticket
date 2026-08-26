export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-semibold">Pagamento pendente</h1>
        <p>Estamos aguardando a confirmação. Você pode acompanhar em “Minha conta”.</p>
        <a href="/" className="text-blue-600 hover:underline">Voltar para a página inicial</a>
      </div>
    </div>
  );
}
