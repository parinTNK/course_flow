import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { FiSearch } from 'react-icons/fi';
import debounce from 'lodash.debounce';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceDelay?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  debounceDelay = 500,
}) => {

  const [inputValue, setInputValue] = useState(value);

  const debouncedOnChange = useMemo(() => {
    return debounce((newValue: string) => {
      onChange(newValue);
    }, debounceDelay);
  }, [onChange, debounceDelay]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue); 
    debouncedOnChange(newValue); 
  };

  return (
    <div className={`relative ${className}`}>
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FiSearch className="text-gray-400" />
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition w-full"
      />
    </div>
  );
};

export default SearchBar;