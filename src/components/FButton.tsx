import React from 'react'

type ButtonSize = 'small' | 'medium' | 'large' | 'xs' | 'xl';

export default function FButton({ children, size = 'medium', ...rest}: { children: React.ReactNode, onClick?: () => void, size?: ButtonSize }) {
    // let textSize = 'text-sm';
    // if (size === 'medium') {
    //     textSize = 'text-base';
    // } else if (size === 'large') {
    //     textSize = 'text-lg';
    // } else if (size === 'xs') {
    //     textSize = 'text-xs';
    // } else if (size === 'xl') {
    //     textSize = 'text-xl';
    // }
    return (
        <button className={`bg-primary text-white text-sm py-2 px-4 rounded-md shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow active:bg-primary/80 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`} {...rest}>
            {children}
        </button>
    )
}
