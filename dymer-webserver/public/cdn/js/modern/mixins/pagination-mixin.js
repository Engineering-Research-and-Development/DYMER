/**
 * PaginationMixin - Reusable pagination logic
 * @version 2.0.0
 */

/**
 * Mixin that adds pagination capabilities
 */
export const PaginationMixin = (Base) => class extends Base {
  static properties = {
    currentPage: { type: Number },
    pageSize: { type: Number },
    totalItems: { type: Number },
    maxVisiblePages: { type: Number }
  };

  constructor() {
    super();
    this.currentPage = 1;
    this.pageSize = 20;
    this.totalItems = 0;
    this.maxVisiblePages = 5;
  }

  /**
   * Get total pages
   */
  get totalPages() {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  /**
   * Get start index for current page
   */
  get startIndex() {
    return (this.currentPage - 1) * this.pageSize;
  }

  /**
   * Get end index for current page
   */
  get endIndex() {
    return Math.min(this.startIndex + this.pageSize, this.totalItems);
  }

  /**
   * Get visible page numbers
   */
  get visiblePages() {
    const pages = [];
    const half = Math.floor(this.maxVisiblePages / 2);
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + this.maxVisiblePages - 1);

    if (end - start < this.maxVisiblePages - 1) {
      start = Math.max(1, end - this.maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Go to specific page
   */
  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.emit('page-change', { page: this.currentPage });
  }

  /**
   * Go to next page
   */
  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  /**
   * Go to previous page
   */
  previousPage() {
    this.goToPage(this.currentPage - 1);
  }

  /**
   * Change page size
   */
  setPageSize(size) {
    this.pageSize = size;
    this.currentPage = 1;
    this.emit('page-size-change', { size: this.pageSize });
  }
};

export default PaginationMixin;
