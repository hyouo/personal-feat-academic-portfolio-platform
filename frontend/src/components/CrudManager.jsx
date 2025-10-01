import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import AttachmentManager from './AttachmentManager';
import RichTextEditor from './RichTextEditor';

// Imports for Drag and Drop
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// A new component to make table rows sortable
function SortableRow({ item, index, displayColumns, parentType, handleEdit, setManagingAttachmentsForItem, handleDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {displayColumns.map(col => <td key={col.key} style={{ border: '1px solid #ddd', padding: '8px' }}>{item[col.key]}</td>)}
      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.is_public ? 'Yes' : 'No'}</td>
      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
        <button onClick={() => handleEdit(item)}>Edit</button>
        {parentType && <button onClick={() => setManagingAttachmentsForItem(item)} style={{ marginLeft: '5px' }}>Attachments</button>}
        <button onClick={() => handleDelete(item.id)} style={{ marginLeft: '5px' }}>Delete</button>
      </td>
    </tr>
  );
}

// The main CrudManager component, now with drag-and-drop functionality
function CrudManager({ sectionTitle, apiEndpoint, formFields, displayColumns, parentType }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [managingAttachmentsForItem, setManagingAttachmentsForItem] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(apiEndpoint);
      setItems(response.data.data || []);
      setError('');
    } catch (err) {
      console.error(`Failed to fetch ${sectionTitle}`, err);
      setError(`Failed to load ${sectionTitle}.`);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, sectionTitle]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNew = () => {
    const blankItem = formFields.reduce((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, { is_public: true });
    setEditingItem(blankItem);
    setIsFormVisible(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsFormVisible(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`${apiEndpoint}/${id}`);
        fetchData();
      } catch (err) {
        console.error('Failed to delete item', err);
        setError('Failed to delete item.');
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingItem((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value, }));
  };

  const handleRichTextChange = (name, value) => {
    setEditingItem((prev) => ({ ...prev, [name]: value, }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem.id) {
        await api.put(`${apiEndpoint}/${editingItem.id}`, editingItem);
      } else {
        await api.post(apiEndpoint, editingItem);
      }
      setIsFormVisible(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save item', err);
      setError('Failed to save item.');
    }
  };

  // Drag and Drop implementation
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require the mouse to be held for 250ms before dragging is initiated
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems); // Optimistically update UI

      // Persist the new order to the backend
      const orderedIds = newItems.map((item) => item.id);
      try {
        await api.post(`${apiEndpoint}/reorder-all`, { orderedIds });
      } catch (err) {
        console.error('Failed to save new order', err);
        setError('Failed to save new order. Please refresh.');
        setItems(items); // Revert UI on failure
      }
    }
  };

  const modalStyles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    content: { background: 'white', padding: '20px', borderRadius: '8px', width: '80%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>{sectionTitle}</h3>
        <button onClick={handleAddNew}>Add New</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {isFormVisible && (
        <form onSubmit={handleFormSubmit} style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h4>{editingItem?.id ? 'Edit' : 'Add'} Item</h4>
          {formFields.map(field => (
            <div key={field.name} style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{field.label}:</label>
              {field.type === 'textarea' ? (
                <RichTextEditor value={editingItem?.[field.name] || ''} onChange={(value) => handleRichTextChange(field.name, value)} />
              ) : (
                <input type={field.type || 'text'} name={field.name} value={editingItem?.[field.name] || ''} onChange={handleFormChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
              )}
            </div>
          ))}
          <div style={{ marginBottom: '10px' }}>
            <label><input type="checkbox" name="is_public" checked={editingItem?.is_public || false} onChange={handleFormChange} /> Show on public page</label>
          </div>
          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsFormVisible(false)} style={{ marginLeft: '10px' }}>Cancel</button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            {displayColumns.map(col => <th key={col.key} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{col.header}</th>)}
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Public</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <tbody>
              {items.map((item, index) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  index={index}
                  displayColumns={displayColumns}
                  parentType={parentType}
                  handleEdit={handleEdit}
                  setManagingAttachmentsForItem={setManagingAttachmentsForItem}
                  handleDelete={handleDelete}
                />
              ))}
            </tbody>
          </SortableContext>
        </DndContext>
      </table>

      {managingAttachmentsForItem && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            <h3>Manage Attachments for "{managingAttachmentsForItem.title || managingAttachmentsForItem.name}"</h3>
            <AttachmentManager parentId={managingAttachmentsForItem.id} parentType={parentType} />
            <button onClick={() => setManagingAttachmentsForItem(null)} style={{ marginTop: '20px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrudManager;