import Swal from 'sweetalert2';

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const showConfirm = async (title: string, text: string, confirmButtonText: string = 'نعم', cancelButtonText: string = 'إلغاء') => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#4F46E5',
    cancelButtonColor: '#777aaf',
    confirmButtonText,
    cancelButtonText,
    padding: '2rem',
    borderRadius: '2rem',
    customClass: {
      popup: 'rounded-[2rem] border-[#d6d6e7]/50 shadow-2xl',
      title: 'font-black text-[#151e63]',
      htmlContainer: 'font-bold text-[#777aaf]',
      confirmButton: 'rounded-xl px-6 py-3 font-black',
      cancelButton: 'rounded-xl px-6 py-3 font-black'
    }
  });
};

export const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonColor: '#4F46E5',
    confirmButtonText: 'حسناً',
    padding: '2rem',
    borderRadius: '2rem',
    customClass: {
      popup: 'rounded-[2rem] border-[#d6d6e7]/50 shadow-2xl',
      title: 'font-black text-[#151e63]',
      htmlContainer: 'font-bold text-[#777aaf]',
      confirmButton: 'rounded-xl px-6 py-3 font-black'
    }
  });
};

export const showSuccess = (title: string, text: string) => showAlert(title, text, 'success');
export const showError = (title: string, text: string) => showAlert(title, text, 'error');
export const showInfo = (title: string, text: string) => showAlert(title, text, 'info');

export default Swal;
