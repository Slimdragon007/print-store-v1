import { ReactNode } from "react";

export function Card({children, className = ""}:{children:ReactNode, className?: string}) {
  return <div className={`border rounded-lg shadow-sm bg-white ${className}`}>{children}</div>;
}

export function CardBody({children}:{children:ReactNode}) {
  return <div className="p-4">{children}</div>;
}

export function CardHeader({children, className = ""}:{children:ReactNode, className?: string}) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardTitle({children, className = ""}:{children:ReactNode, className?: string}) {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
}

export function CardDescription({children, className = ""}:{children:ReactNode, className?: string}) {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
}

export function CardContent({children, className = ""}:{children:ReactNode, className?: string}) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}

export function CardFooter({children, className = ""}:{children:ReactNode, className?: string}) {
  return <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;
}
