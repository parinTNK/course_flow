type ButtonProps = {
    variant?: "primary"  | "Secondary" | "ghost";
    onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
    children: React.ReactNode;
    className?: string;
  };
  
  function ButtonT({
    variant = "primary",
    onClick,
    children,
    className = "",
  }: ButtonProps) {
  
    const variantStyles = {
      primary: "bg-[var(--blue-500)] hover:bg-blue-700 text-white w-[126px] h-[60px] rounded-[12px] text-[var(--B2)] font-bold px-[32px] py-[18px] cursor-pointer",
      Secondary: "bg-[var(--white)] w-[149px] h-[60px] rounded-[12px] text-[var(--B2)] font-bold px-[32px] py-[18px] text-[var(--orange-500)] border-[2px] border-[var(--orange-500)] hover:bg-[var(--orange-500)] hover:text-white cursor-pointer",
      ghost: "w-[126px] h-[60px] rounded-[12px] text-[var(--B2)] font-bold px-[32px] py-[18px] text-[var(--blue-500)] border border-[var(--blue-500)] bg-transparent hover:bg-[var(--blue-500)] hover:text-white transition-colors cursor-pointer dark:hover:bg-[var(--blue-400)]",
        };
  
    return (
      <button 
        className={`${variantStyles[variant]} ${className}`}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }
  
  function Buttons() {
    return (
      <div className="flex flex-col gap-4">
        <ButtonT variant="primary">Primary</ButtonT>
        <ButtonT variant="primary" className="w-[200px]">Primary</ButtonT>
        <ButtonT variant="Secondary">Secondary</ButtonT>
        <ButtonT variant="Secondary" className="!bg-[var(--orange-100)]">Secondary2</ButtonT>
  
      </div>
    );
  }
  
  export default Buttons;
  export { ButtonT };