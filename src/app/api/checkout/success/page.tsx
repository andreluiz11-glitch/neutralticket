export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-semibold">Pagamento aprovado 🎉</h1>
        <p>Obrigado pela compra! Você receberá um email com os detalhes.</p>
        <a href="/" className="text-blue-600 hover:underline">Voltar para a página inicial</a>
      </div>
    </div>
  );
}
