import Layout from "@/components/Layout";
import Link from "next/link";
import {useEffect, useState} from "react";
import axios from "axios";
import {useRouter} from "next/router";

export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(router.query.search || '');
  const [statusFilter, setStatusFilter] = useState(router.query.status || '');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  });

  const currentPage = parseInt(router.query.page) || 1;

  useEffect(() => {
    fetchProducts();
  }, [currentPage, router.query.search, router.query.status]);

  function fetchProducts() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('limit', '30');
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    if (statusFilter) {
      params.set('status', statusFilter);
    }

    axios.get('/api/products?' + params.toString()).then(response => {
      setProducts(response.data.products || []);
      setPagination(response.data.pagination || {
        page: 1,
        totalPages: 1,
        totalCount: 0,
      });
      setLoading(false);
    }).catch(error => {
      console.error('Error fetching products:', error);
      setLoading(false);
    });
  }

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    if (statusFilter) {
      params.set('status', statusFilter);
    }
    params.set('page', '1'); // Reset to page 1 on new search
    router.push('/products?' + params.toString());
  }

  function handleStatusChange(newStatus) {
    setStatusFilter(newStatus);
    const params = new URLSearchParams();
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    if (newStatus) {
      params.set('status', newStatus);
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    router.push('/products?' + params.toString());
  }

  function handlePageChange(newPage) {
    const params = new URLSearchParams();
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    if (statusFilter) {
      params.set('status', statusFilter);
    }
    if (newPage > 1) {
      params.set('page', newPage);
    }
    router.push('/products?' + params.toString());
  }

  return (
    <Layout>
      <div className="mb-4">
        <Link className="btn-primary" href={'/products/new'}>Добави нова книга</Link>
      </div>

      <div className="mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 items-center flex-wrap">
          <input
            type="text"
            placeholder="Търси по заглавие, автор, ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-2 border rounded min-w-[200px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Всички статуси</option>
            <option value="available">Налична</option>
            <option value="borrowed">Заета</option>
          </select>
          <button type="submit" className="btn-default">
            Търси
          </button>
          {(searchTerm || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                router.push('/products');
              }}
              className="btn-default"
            >
              Изчисти
            </button>
          )}
        </form>
      </div>

      {(searchTerm || statusFilter) && (
        <div className="mb-2 text-sm text-gray-600">
          Намерени {pagination.totalCount} {pagination.totalCount === 1 ? 'книга' : 'книги'}
          {searchTerm && ` за "${searchTerm}"`}
          {statusFilter && ` (${statusFilter === 'available' ? 'Налична' : 'Заета'})`}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Зареждане...</div>
      ) : (
        <>
          <table className="basic mt-2">
            <thead>
              <tr>
                <td>Име на книгата</td>
                <td>Автор</td>
                <td>Наличност (бр.)</td>
                <td>Статус</td>
                <td></td>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    {searchTerm ? 'Няма намерени книги.' : 'Няма книги.'}
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product._id}>
                    <td>{product.title}</td>
                    <td>{product.author || '-'}</td>
                    <td>{product.stock ?? 0}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.status === 'available' || product.stock > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'available' || product.stock > 0 ? 'Налична' : 'Заета'}
                      </span>
                    </td>
                    <td>
                      <Link className="btn-default" href={'/products/'+product._id}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Детайли
                      </Link>
                      <Link className="btn-default" href={'/products/edit/'+product._id}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Редактирай
                      </Link>
                      <Link className="btn-red" href={'/products/delete/'+product._id}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Изтрий
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-default"
              >
                ← Назад
              </button>
              <span className="px-4">
                Страница {pagination.page} от {pagination.totalPages}
                {pagination.totalCount > 0 && (
                  <span className="text-gray-500 ml-2">
                    (Общо: {pagination.totalCount})
                  </span>
                )}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="btn-default"
              >
                Напред →
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}