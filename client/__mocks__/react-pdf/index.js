module.exports = {
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: '',
    },
  },
  Document: function Document(props) {
    return props.children;
  },
  Page: function Page(props) {
    return null;
  },
}; 