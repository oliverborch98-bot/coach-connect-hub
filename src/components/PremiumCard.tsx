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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
            className={`premium-card p-8 border-white/5 relative overflow-hidden group ${className}`}
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -mr-32 -mt-32 transition-all duration-700 group-hover:bg-primary/10" />
            
            {(title || headerAction) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
                    <div>
                        {title && (
                            <h3 className="text-xl font-black tracking-tighter lime-text flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                {title}
                            </h3>
                        )}
                        {subtitle && <p className="text-[11px] text-muted-foreground mt-2 font-black uppercase tracking-[0.2em]">{subtitle}</p>}
                    </div>
                    {headerAction}
                </div>
            )}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}
