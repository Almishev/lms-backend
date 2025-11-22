import ProductForm from "@/components/ProductForm";
import Layout from "@/components/Layout";

export default function NewProduct() {
  return (
    <Layout>
      <h1>Нова книга</h1>
      <ProductForm />
    </Layout>
  );
}