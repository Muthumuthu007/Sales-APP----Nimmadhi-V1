import {ProductMrpContext} from '../../context/ProductMrpContext';
import {enrichProductOptions,productListEntries} from '../../utils/productHierarchy';
import ProductMrp from '../ProductMrp';
import React, { useState, useRef, useEffect, useId, useContext } from 'react';
import { ChevronDown } from 'lucide-react';
import './SearchableSelect.css';

export const SearchableSelect = ({ label, options, value, onChange, error, placeholder }) => {
  const {catalogue=[]}=useContext(ProductMrpContext);
  options=enrichProductOptions(options,catalogue);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex,setActiveIndex]=useState(0);
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

  const term=search.toLowerCase();
  const filteredOptions=options.filter(opt=>`${opt.label} ${opt.group || ''} ${opt.mainGroupName || ''}`.toLowerCase().includes(term));
  const entries=productListEntries(filteredOptions.filter(option=>option.value));
  const navigableOptions=entries.filter(entry=>entry.kind==='product').map(entry=>entry.option);
  const activeOption=navigableOptions[Math.min(activeIndex,Math.max(0,navigableOptions.length-1))];
  const choose=option=>{if(!option)return;onChange(option.value);setIsOpen(false);setSearch('');setActiveIndex(0);document.getElementById(`${listId}-trigger`)?.focus();};
  const searchKeys=event=>{
    if(['Enter','ArrowDown','ArrowUp','Escape'].includes(event.key)){event.preventDefault();event.stopPropagation();}
    if(event.key==='ArrowDown')setActiveIndex(index=>Math.max(0,Math.min(index+1,navigableOptions.length-1)));
    if(event.key==='ArrowUp')setActiveIndex(index=>Math.max(0,index-1));
    if(event.key==='Enter')choose(activeOption);
    if(event.key==='Escape'){setIsOpen(false);document.getElementById(`${listId}-trigger`)?.focus();}
    if(event.key==='Tab')setIsOpen(false);
  };
  useEffect(()=>{if(isOpen)document.getElementById(`${listId}-option-${activeIndex}`)?.scrollIntoView({block:'nearest'});},[activeIndex,isOpen,listId]);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="input-group" ref={wrapperRef} data-searchable-select>
      {label && <label htmlFor={`${listId}-trigger`} className="input-label">{label}</label>}
      <div className="searchable-select">
        <button type="button" id={`${listId}-trigger`} aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={listId}
          className={`select-trigger ${error ? 'input-error' : ''} ${isOpen ? 'open' : ''}`}
          onClick={() => {setIsOpen(!isOpen);setActiveIndex(0);}}
          onKeyDown={event => {if(event.key==='ArrowDown'){event.preventDefault();setActiveIndex(0);setIsOpen(true);} if(event.key==='Escape')setIsOpen(false);}}
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
                role="combobox" aria-expanded={isOpen} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={activeOption?`${listId}-option-${navigableOptions.indexOf(activeOption)}`:undefined}
                onKeyDown={searchKeys}
                value={search}
                onChange={(e) => {setSearch(e.target.value);setActiveIndex(0);}}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ul id={listId} className="select-options-list" role="listbox" aria-label={label || 'Products'}>
              {entries.length?entries.map((entry,index)=>entry.kind==='group'?<li key={`group-${entry.id}-${index}`} className="select-group-label" role="presentation" style={{paddingLeft:`${.75+entry.depth*.65}rem`}}>{entry.label}</li>:<li key={`${entry.option.value}-${index}`} id={`${listId}-option-${navigableOptions.indexOf(entry.option)}`} className={`select-option ${value===entry.option.value?'selected':''} ${activeOption===entry.option?'keyboard-active':''}`} role="option" aria-selected={value===entry.option.value} tabIndex={-1} style={{paddingLeft:`${.75+entry.depth*.65}rem`}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();choose(entry.option);}}} onClick={()=>choose(entry.option)}>{entry.option.label}<ProductMrp item={entry.option}/></li>):<li className="select-no-results">No products match your search</li>}

            </ul>
          </div>
        )}
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
};
