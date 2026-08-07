import { PermissionState } from './notifications';

export const filesCapability = {
  isSupported(): boolean {
    return typeof document !== 'undefined';
  },

  async getStatus(): Promise<PermissionState> {
    // Modern browser and native file pickers use scoped user-initiated picker (always available)
    return 'granted';
  },

  async pickFiles(accept: string = '*/*', multiple: boolean = false): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.multiple = multiple;
      input.style.display = 'none';

      input.onchange = () => {
        const files = input.files ? Array.from(input.files) : [];
        document.body.removeChild(input);
        resolve(files);
      };

      input.oncancel = () => {
        document.body.removeChild(input);
        resolve([]);
      };

      document.body.appendChild(input);
      input.click();
    });
  }
};
