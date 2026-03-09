import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PremiumCardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    headerAction?: ReactNode;
    delay?: number;
}

export default function PremiumCard({
    children,
    className = "",
    title,
    subtitle,
    headerAction,
    delay = 0
}: PremiumCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={`premium-card p-6 ${className}`}
        >
            {(title || headerAction) && (
                <div className="flex items-center justify-between mb-6">
                    <div>
                        {title && <h3 className="text-lg font-bold tracking-tight text-glow">{title}</h3>}
                        {subtitle && <p className="text-xs text-muted-foreground mt-1 font-medium italic">{subtitle}</p>}
                    </div>
                    {headerAction}
                </div>
            )}
            {children}
        </motion.div>
    );
}
