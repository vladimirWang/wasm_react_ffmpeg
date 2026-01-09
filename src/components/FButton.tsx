import React from 'react'

export default function FButton({ children, ...rest}: { children: React.ReactNode, onClick?: () => void }) {
    return (
        <button className="bg-primary text-white text-sm py-2 px-4 rounded-md shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow active:bg-primary/80 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" {...rest}>
            {children}
        </button>
    )
}
