import Layout from "@/components/Layout";
import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import axios from "axios";
import Link from "next/link";

export default function BookDetailsPage() {
  const router = useRouter();
  const {id} = router.query;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGiveForm, setShowGiveForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [giveFormData, setGiveFormData] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
  });
  const [returnFormData, setReturnFormData] = useState({
    borrowedRecordIndex: '',
  });

  useEffect(() => {
    if (!id) return;
    fetchBook();
  }, [id]);

  function fetchBook() {
    axios.get('/api/products?id=' + id).then(response => {
      setBook(response.data);
      setLoading(false);
    });
  }

  async function handleGiveBook(e) {
    e.preventDefault();
    try {
      await axios.post('/api/books/give', {
        bookId: id,
        ...giveFormData,
      });
      setShowGiveForm(false);
      setGiveFormData({userName: '', userEmail: '', userPhone: ''});
      fetchBook();
    } catch (error) {
      alert(error.response?.data?.message || 'Грешка при даване на книга');
    }
  }

  async function handleReturnBook(e) {
    e.preventDefault();
    try {
      await axios.post('/api/books/return', {
        bookId: id,
        borrowedRecordIndex: parseInt(returnFormData.borrowedRecordIndex),
      });
      setShowReturnForm(false);
      setReturnFormData({borrowedRecordIndex: ''});
      fetchBook();
    } catch (error) {
      alert(error.response?.data?.message || 'Грешка при връщане на книга');
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <Layout>
        <div>Зареждане...</div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div>Книгата не е намерена</div>
      </Layout>
    );
  }

  const activeBorrows = book.borrowedBy?.filter(record => !record.returnedDate) || [];
  const allBorrows = book.borrowedBy || [];

  return (
    <Layout>
      <Link href="/products" className="btn-default mb-4">
        ← Назад към списъка
      </Link>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <h1 className="text-2xl font-bold mb-4">{book.title}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <strong>Автор:</strong> {book.author || '-'}
          </div>
          <div>
            <strong>ISBN:</strong> {book.isbn || '-'}
          </div>
          <div>
            <strong>Издателство:</strong> {book.publisher || '-'}
          </div>
          <div>
            <strong>Година:</strong> {book.publishedYear || '-'}
          </div>
          <div>
            <strong>Наличност:</strong> {book.stock ?? 0} бр.
          </div>
          <div>
            <strong>Статус:</strong> 
            <span className={`ml-2 px-2 py-1 rounded ${book.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {book.status === 'available' ? 'Налична' : 'Заета'}
            </span>
          </div>
        </div>

        {book.description && (
          <div className="mb-4">
            <strong>Описание:</strong>
            <p className="mt-2">{book.description}</p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              setShowGiveForm(true);
              setShowReturnForm(false);
            }}
            className="btn-primary"
            disabled={book.stock <= 0}
          >
            Дай книга
          </button>
          {activeBorrows.length > 0 && (
            <button
              onClick={() => {
                setShowReturnForm(true);
                setShowGiveForm(false);
              }}
              className="btn-default"
            >
              Върни книга
            </button>
          )}
        </div>
      </div>

      {showGiveForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">Даване на книга</h2>
          <form onSubmit={handleGiveBook}>
            <div className="mb-4">
              <label className="block mb-2">Име на читателя *</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={giveFormData.userName}
                onChange={e => setGiveFormData({...giveFormData, userName: e.target.value})}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Email</label>
              <input
                type="email"
                className="w-full p-2 border rounded"
                value={giveFormData.userEmail}
                onChange={e => setGiveFormData({...giveFormData, userEmail: e.target.value})}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Телефон</label>
              <input
                type="tel"
                className="w-full p-2 border rounded"
                value={giveFormData.userPhone}
                onChange={e => setGiveFormData({...giveFormData, userPhone: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Потвърди</button>
              <button
                type="button"
                onClick={() => setShowGiveForm(false)}
                className="btn-default"
              >
                Отказ
              </button>
            </div>
          </form>
        </div>
      )}

      {showReturnForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">Връщане на книга</h2>
          <form onSubmit={handleReturnBook}>
            <div className="mb-4">
              <label className="block mb-2">Избери запис за връщане</label>
              <select
                className="w-full p-2 border rounded"
                value={returnFormData.borrowedRecordIndex}
                onChange={e => setReturnFormData({...returnFormData, borrowedRecordIndex: e.target.value})}
                required
              >
                <option value="">-- Избери --</option>
                {allBorrows.map((record, index) => {
                  if (record.returnedDate) return null;
                  return (
                    <option key={index} value={index}>
                      {record.userName} ({record.userEmail || record.userPhone || 'без контакт'}) - 
                      Взета на: {formatDate(record.borrowedDate)}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Потвърди връщане</button>
              <button
                type="button"
                onClick={() => setShowReturnForm(false)}
                className="btn-default"
              >
                Отказ
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">История на заеманията</h2>
        {allBorrows.length === 0 ? (
          <p className="text-gray-500">Няма записи за заемане</p>
        ) : (
          <table className="basic w-full">
            <thead>
              <tr>
                <td>Име</td>
                <td>Email</td>
                <td>Телефон</td>
                <td>Дата на взимане</td>
                <td>Дата на връщане</td>
                <td>Статус</td>
              </tr>
            </thead>
            <tbody>
              {allBorrows.map((record, index) => (
                <tr key={index}>
                  <td>{record.userName}</td>
                  <td>{record.userEmail || '-'}</td>
                  <td>{record.userPhone || '-'}</td>
                  <td>{formatDate(record.borrowedDate)}</td>
                  <td>{formatDate(record.returnedDate)}</td>
                  <td>
                    <span className={`px-2 py-1 rounded ${
                      record.returnedDate 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.returnedDate ? 'Върната' : 'Активна'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

