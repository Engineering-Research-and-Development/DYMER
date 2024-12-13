import { createContext, useContext, PropsWithChildren } from 'react';
import { toast, ToastContainer, ToastOptions } from 'react-toastify'; // Importa React-Toastify
import 'react-toastify/dist/ReactToastify.css'; // Importa i CSS di React-Toastify
import './toastStyle.css'

export enum ToastType {
    Success = "success",
    Error = "error",
    Info = "info",
    Warning = "warning"
}

interface IToastContextType {
    showToast: (message: string, type: ToastType, options?: ToastOptions) => void;
}

const ToastsContext = createContext<IToastContextType>({} as IToastContextType)

export const useToast = (): IToastContextType => {
    const context = useContext(ToastsContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastsProvider = ({ children }: PropsWithChildren) => {
    const showToast = (message: string, type: ToastType, options?: ToastOptions) => {
        toast[type](message, options);
    };

    return (
        <ToastsContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                draggable
                theme="light"
            />
        </ToastsContext.Provider>
    );
};
