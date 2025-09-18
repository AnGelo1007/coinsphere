
'use client';

import { useTheme } from 'next-themes';
import Select, { type StylesConfig } from 'react-select';
import { useId } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  isLoading,
}: MultiSelectProps) {
  const { resolvedTheme } = useTheme();

  const customStyles: StylesConfig<MultiSelectOption, true> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'hsl(var(--input))',
      borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--input))',
      boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--ring))' : 'none',
      '&:hover': {
        borderColor: 'hsl(var(--ring))',
      },
      color: 'hsl(var(--foreground))',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'hsl(var(--popover))',
      color: 'hsl(var(--popover-foreground))',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? 'hsl(var(--primary))'
        : state.isFocused
        ? 'hsl(var(--accent))'
        : 'transparent',
      color: state.isSelected
        ? 'hsl(var(--primary-foreground))'
        : 'hsl(var(--popover-foreground))',
      '&:hover': {
        backgroundColor: 'hsl(var(--accent))',
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'hsl(var(--secondary))',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'hsl(var(--secondary-foreground))',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'hsl(var(--secondary-foreground))',
      '&:hover': {
        backgroundColor: 'hsl(var(--destructive))',
        color: 'hsl(var(--destructive-foreground))',
      },
    }),
  };

  const selectedOptions = options.filter((option) =>
    value.includes(option.value)
  );

  return (
    <Select
      isMulti
      instanceId={useId()}
      options={options}
      value={selectedOptions}
      onChange={(selected) => {
        onChange(selected.map((s) => s.value));
      }}
      placeholder={placeholder}
      isLoading={isLoading}
      styles={customStyles}
      theme={(theme) => ({
        ...theme,
        borderRadius: 5,
        colors: {
          ...theme.colors,
          primary: 'hsl(var(--primary))',
          primary25: 'hsl(var(--accent))',
          neutral0: resolvedTheme === 'dark' ? '#020817' : '#FFFFFF',
          neutral20: 'hsl(var(--border))',
          neutral30: 'hsl(var(--border))',
          neutral50: 'hsl(var(--muted-foreground))',
          neutral80: 'hsl(var(--foreground))',
        },
      })}
    />
  );
}
