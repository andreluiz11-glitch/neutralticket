export default function FailurePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-semibold">Pagamento não aprovado</h1>
        <p>Tente novamente ou escolha outro método de pagamento.</p>
        <a href="/" className="text-blue-600 hover:underline">Voltar para a página inicial</a>
      </div>
    </div>
  );
}
