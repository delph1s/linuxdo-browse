interface Window {
  unsafeWindow?: Window;
}

interface XMLHttpRequest {
  _custom_storage: {
    method: string;
    url: string | URL;
  };
}
