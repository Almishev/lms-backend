import Layout from "@/components/Layout";
import {useEffect, useState} from "react";
import axios from "axios";
import Spinner from "@/components/Spinner";
import { withSwal } from 'react-sweetalert2';

function Categories({swal}) {
  const [editedCategory, setEditedCategory] = useState(null);
  const [name,setName] = useState('');
  const [parentCategory,setParentCategory] = useState('');
  const [categories,setCategories] = useState([]);
  const [properties,setProperties] = useState([]);
  const [image,setImage] = useState('');
  const [isUploading,setIsUploading] = useState(false);
  useEffect(() => {
    fetchCategories();
  }, [])
  function fetchCategories() {
    axios.get('/api/categories').then(result => {
      setCategories(result.data);
    });
  }
  async function saveCategory(ev){
    ev.preventDefault();
    if (!name || !name.trim()) {
      alert('Моля, въведете име на жанра');
      return;
    }
    const data = {
      name: name.trim(),
      parentCategory,
      image,
      properties:properties.map(p => ({
        name:p.name,
        values:p.values.split(','),
      })),
    };
    if (editedCategory) {
      data._id = editedCategory._id;
      await axios.put('/api/categories', data);
      setEditedCategory(null);
    } else {
      await axios.post('/api/categories', data);
    }
    setName('');
    setParentCategory('');
    setProperties([]);
    setImage('');
    fetchCategories();
  }
  function editCategory(category){
    setEditedCategory(category);
    setName(category.name);
    setParentCategory(category.parent?._id);
    setImage(category.image || '');
    setProperties(
      category.properties.map(({name,values}) => ({
      name,
      values:values.join(',')
    }))
    );
  }
  function deleteCategory(category){
    swal.fire({
      title: 'Сигурни ли сте?',
      text: `Искате ли да изтриете ${category.name}?`,
      showCancelButton: true,
      cancelButtonText: 'Отказ',
      confirmButtonText: 'Да, изтрий!',
      confirmButtonColor: '#d55',
      reverseButtons: true,
    }).then(async result => {
      if (result.isConfirmed) {
        const {_id} = category;
        await axios.delete('/api/categories?_id='+_id);
        fetchCategories();
      }
    });
  }
  function addProperty() {
    setProperties(prev => {
      return [...prev, {name:'',values:''}];
    });
  }
  function handlePropertyNameChange(index,property,newName) {
    setProperties(prev => {
      const properties = [...prev];
      properties[index].name = newName;
      return properties;
    });
  }
  function handlePropertyValuesChange(index,property,newValues) {
    setProperties(prev => {
      const properties = [...prev];
      properties[index].values = newValues;
      return properties;
    });
  }
  function removeProperty(indexToRemove) {
    setProperties(prev => {
      return [...prev].filter((p,pIndex) => {
        return pIndex !== indexToRemove;
      });
    });
  }
  return (
    <Layout>
      <h1>Жанрове</h1>
      <label>
        {editedCategory
          ? `Редактирай жанр ${editedCategory.name}`
          : 'Създай нов жанр'}
      </label>
      <form onSubmit={saveCategory}>
        <div className="flex gap-1">
          <input
            type="text"
            placeholder={'Име на жанра'}
            onChange={ev => setName(ev.target.value)}
            value={name}/>
          <select
                  onChange={ev => setParentCategory(ev.target.value)}
                  value={parentCategory}>
            <option value="">Няма родителски жанр</option>
            {categories.length > 0 && categories.map(category => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block mb-1">Снимка</label>
          <div className="mb-2 flex flex-wrap gap-2 items-center">
            {image && (
              <img src={image} alt="genre" className="h-24 rounded border" />
            )}
            {isUploading && (
              <div className="h-24 flex items-center">
                <Spinner />
              </div>
            )}
          </div>
          <label className="w-48 h-24 cursor-pointer text-center flex flex-col items-center justify-center text-sm gap-1 text-primary rounded-sm bg-white shadow-sm border border-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div>Качи снимка</div>
            <input type="file" onChange={async ev => {
              const files = ev.target?.files;
              if (files?.length > 0) {
                setIsUploading(true);
                const data = new FormData();
                for (const file of files) {
                  data.append('file', file);
                }
                const res = await axios.post('/api/upload', data);
                setImage(res.data.links?.[0] || '');
                setIsUploading(false);
              }
            }} className="hidden" />
          </label>
        </div>
        <div className="mb-2">
          <label className="block">Свойства</label>
          <button
            onClick={addProperty}
            type="button"
            className="btn-default text-sm mb-2">
            Добави ново свойство
          </button>
          {properties.length > 0 && properties.map((property,index) => (
            <div key={index} className="flex gap-1 mb-2">
              <input type="text"
                     value={property.name}
                     className="mb-0"
                     onChange={ev => handlePropertyNameChange(index,property,ev.target.value)}
                     placeholder="име на свойството (пример: цвят)"/>
              <input type="text"
                     className="mb-0"
                     onChange={ev =>
                       handlePropertyValuesChange(
                         index,
                         property,ev.target.value
                       )}
                     value={property.values}
                     placeholder="стойности, разделени със запетая"/>
              <button
                onClick={() => removeProperty(index)}
                type="button"
                className="btn-red">
                Премахни
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {editedCategory && (
            <button
              type="button"
              onClick={() => {
                setEditedCategory(null);
                setName('');
                setParentCategory('');
                setProperties([]);
              }}
              className="btn-default">Отказ</button>
          )}
          <button type="submit"
                  className="btn-primary py-1">
            Запази
          </button>
        </div>
      </form>
      {!editedCategory && (
        <table className="basic mt-4">
          <thead>
          <tr>
            <td>Име на жанра</td>
            <td>Снимка</td>
            <td>Родителски жанр</td>
            <td></td>
          </tr>
          </thead>
          <tbody>
          {categories.length > 0 && categories.map(category => (
            <tr key={category._id}>
              <td>{category.name}</td>
              <td>{category.image && (<img src={category.image} alt="" className="h-12 rounded" />)}</td>
              <td>{category?.parent?.name}</td>
              <td>
                <button
                  onClick={() => editCategory(category)}
                  className="btn-default mr-1"
                >
                  Редактирай
                </button>
                <button
                  onClick={() => deleteCategory(category)}
                  className="btn-red">Изтрий</button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}

export default withSwal(({swal}, ref) => (
  <Categories swal={swal} />
));
