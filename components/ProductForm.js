import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import axios from "axios";
import Spinner from "@/components/Spinner";
import {ReactSortable} from "react-sortablejs";

export default function ProductForm({
  _id,
  title:existingTitle,
  description:existingDescription,
  author:existingAuthor,
  isbn:existingIsbn,
  publisher:existingPublisher,
  publishedYear:existingPublishedYear,
  images:existingImages,
  category:assignedCategory,
  properties:assignedProperties,
  stock:existingStock,
}) {
  const [title,setTitle] = useState(existingTitle || '');
  const [description,setDescription] = useState(existingDescription || '');
  const [author,setAuthor] = useState(existingAuthor || '');
  const [isbn,setIsbn] = useState(existingIsbn || '');
  const [publisher,setPublisher] = useState(existingPublisher || '');
  const [publishedYear,setPublishedYear] = useState(existingPublishedYear || '');
  const [category,setCategory] = useState(assignedCategory || '');
  const [productProperties,setProductProperties] = useState(assignedProperties || {});
  const [images,setImages] = useState(existingImages || []);
  const [stock,setStock] = useState(existingStock ?? 0);
  const [goToProducts,setGoToProducts] = useState(false);
  const [isUploading,setIsUploading] = useState(false);
  const [categories,setCategories] = useState([]);
  const router = useRouter();
  useEffect(() => {
    axios.get('/api/categories').then(result => {
      setCategories(result.data);
    })
  }, []);
  async function saveProduct(ev) {
    ev.preventDefault();
    const data = {
      title,description,author,isbn,publisher,publishedYear,images,category,stock,
      properties:productProperties
    };
    if (_id) {
      //update
      await axios.put('/api/products', {...data,_id});
    } else {
      //create
      await axios.post('/api/products', data);
    }
    setGoToProducts(true);
  }
  if (goToProducts) {
    router.push('/products');
  }
  async function uploadImages(ev) {
    const files = ev.target?.files;
    if (files?.length > 0) {
      setIsUploading(true);
      const data = new FormData();
      for (const file of files) {
        data.append('file', file);
      }
      const res = await axios.post('/api/upload', data);
      setImages(oldImages => {
        return [...oldImages, ...res.data.links];
      });
      setIsUploading(false);
    }
  }
  function updateImagesOrder(images) {
    setImages(images);
  }
  function setProductProp(propName,value) {
    setProductProperties(prev => {
      const newProductProps = {...prev};
      newProductProps[propName] = value;
      return newProductProps;
    });
  }

  const propertiesToFill = [];
  if (categories.length > 0 && category) {
    let catInfo = categories.find(({_id}) => _id === category);
    propertiesToFill.push(...catInfo.properties);
    while(catInfo?.parent?._id) {
      const parentCat = categories.find(({_id}) => _id === catInfo?.parent?._id);
      propertiesToFill.push(...parentCat.properties);
      catInfo = parentCat;
    }
  }

  return (
      <form onSubmit={saveProduct}>
        <label>Заглавие на книгата</label>
        <input
          type="text"
          placeholder="Заглавие на книгата"
          value={title}
          onChange={ev => setTitle(ev.target.value)}/>
        <label>Автор</label>
        <input
          type="text"
          placeholder="Автор"
          value={author}
          onChange={ev => setAuthor(ev.target.value)}/>
        <label>ISBN</label>
        <input
          type="text"
          placeholder="ISBN номер"
          value={isbn}
          onChange={ev => setIsbn(ev.target.value)}/>
        <label>Издателство</label>
        <input
          type="text"
          placeholder="Издателство"
          value={publisher}
          onChange={ev => setPublisher(ev.target.value)}/>
        <label>Година на издаване</label>
        <input
          type="number"
          placeholder="Година на издаване"
          min="1000"
          max={new Date().getFullYear()}
          value={publishedYear}
          onChange={ev => setPublishedYear(ev.target.value)}/>
        <label>Жанр</label>
        <select value={category}
                onChange={ev => setCategory(ev.target.value)}>
          <option value="">Без жанр</option>
          {categories.length > 0 && categories.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <label>Наличност (бр.)</label>
        <input
          type="number"
          min="0"
          value={stock}
          onChange={ev => setStock(parseInt(ev.target.value || '0',10))}/>
        {propertiesToFill.length > 0 && propertiesToFill.map(p => (
          <div key={p.name} className="">
            <label>{p.name[0].toUpperCase()+p.name.substring(1)}</label>
            <div>
              <select value={productProperties[p.name]}
                      onChange={ev =>
                        setProductProp(p.name,ev.target.value)
                      }
              >
                {p.values.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
        <label>
          Снимки
        </label>
        <div className="mb-2 flex flex-wrap gap-1">
          <ReactSortable
            list={images}
            className="flex flex-wrap gap-1"
            setList={updateImagesOrder}>
            {!!images?.length && images.map(link => (
              <div key={link} className="h-24 bg-white p-4 shadow-sm rounded-sm border border-gray-200">
                <img src={link} alt="" className="rounded-lg"/>
              </div>
            ))}
          </ReactSortable>
          {isUploading && (
            <div className="h-24 flex items-center">
              <Spinner />
            </div>
          )}
          <label className="w-24 h-24 cursor-pointer text-center flex flex-col items-center justify-center text-sm gap-1 text-primary rounded-sm bg-white shadow-sm border border-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div>
              Добави снимка
            </div>
            <input type="file" onChange={uploadImages} className="hidden"/>
          </label>
        </div>
        <label>Описание</label>
        <textarea
          placeholder="описание"
          value={description}
          onChange={ev => setDescription(ev.target.value)}
        />
        <button
          type="submit"
          className="btn-primary">
          Запази
        </button>
      </form>
  );
}
