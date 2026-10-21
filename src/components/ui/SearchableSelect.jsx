import ProductMrp from '../ProductMrp';
import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import './SearchableSelect.css';

export const SearchableSelect = ({ label, options, value, onChange, error, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const listId = useId();
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const groupedOptions = filteredOptions.reduce((groups, option) => {
    const group = option.group || 'Other products';
    if (!groups[group]) groups[group] = [];
    groups[group].push(option);
    return groups;
  }, {});

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="input-group" ref={wrapperRef}>
      {label && <label htmlFor={`${listId}-trigger`} className="input-label">{label}</label>}
      <div className="searchable-select">
        <button type="button" id={`${listId}-trigger`} aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={listId}
          className={`select-trigger ${error ? 'input-error' : ''} ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={event => { if (event.key === 'Escape') setIsOpen(false); }}
        >
          <span className={selectedOption && selectedOption.value !== '' ? "selected-text" : "placeholder-text"}>
            {selectedOption && selectedOption.label !== 'Select a product...' ? <>{selectedOption.label}{selectedOption.group && <ProductMrp item={selectedOption}/>}</> : (placeholder || 'Select a product...')}
          </span>
          <ChevronDown size={16} className="trigger-icon" />
        </button>

        {isOpen && (
          <div className="select-dropdown">
            <div className="select-search-box">
              <input 
                type="text" 
                placeholder="Search products..."
                aria-label={label ? `Search ${label}` : 'Search products'}
                onKeyDown={event => { if (event.key === 'Escape') { setIsOpen(false); document.getElementById(`${listId}-trigger`)?.focus(); } }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ul id={listId} className="select-options-list" role="listbox" aria-label={label || 'Products'}>
              {filteredOptions.length > 0 ? (
                Object.entries(groupedOptions).map(([group, groupOptions]) => (
                  <React.Fragment key={group}>
                    {groupOptions.some(option => option.group) && (
                      <li className="select-group-label" aria-hidden="true">{group}</li>
                    )}
                    {groupOptions.map((opt, i) => (
                      <li 
                        key={`${group}-${opt.value}-${i}`} 
                        className={`select-option ${value === opt.value ? 'selected' : ''}`}
                        role="option" aria-selected={value === opt.value} tabIndex={0}
                        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onChange(opt.value); setIsOpen(false); setSearch(''); document.getElementById(`${listId}-trigger`)?.focus(); } }}
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                          setSearch('');
                        }}
                      >
                        {opt.label}{opt.group && opt.value && <ProductMrp item={opt}/>}
                      </li>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <li className="select-no-results">No products match your search</li>
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
};
