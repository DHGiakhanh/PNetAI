export const ProductDetail = () => {
  return (
    <section className="py-24 px-6 lg:px-24 bg-warm/40">
      <div className="mx-auto max-w-4xl rounded-[36px] border border-sand/50 bg-white p-10 shadow-xl">
        <p className="text-xs uppercase tracking-[0.12em] text-caramel font-semibold mb-3">Product Focus</p>
        <h2 className="text-4xl font-serif font-bold text-ink mb-4">Selected item preview</h2>
        <p className="text-muted leading-relaxed">
          This is a placeholder detail panel for the featured product click flow on Landing. You can connect this to
          real product data next.
        </p>
      </div>
    </section>
  );
};

export default ProductDetail;
