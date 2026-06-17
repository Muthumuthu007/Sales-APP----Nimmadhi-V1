import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './SearchableSelect.css';

export const SearchableSelect = ({ label, options, value, onChange, error, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="input-group" ref={wrapperRef}>
      {label && <label className="input-label">{label}</label>}
      <div className="searchable-select">
        <div 
          className={`select-trigger ${error ? 'input-error' : ''} ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={selectedOption && selectedOption.value !== '' ? "selected-text" : "placeholder-text"}>
            {selectedOption && selectedOption.label !== 'Select a product...' ? selectedOption.label : (placeholder || 'Select a product...')}
          </span>
          <ChevronDown size={16} className="trigger-icon" />
        </div>

        {isOpen && (
          <div className="select-dropdown">
            <div className="select-search-box">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ul className="select-options-list">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, i) => (
                  <li 
                    key={i} 
                    className={`select-option ${value === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                  >
                    {opt.label}
                  </li>
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
