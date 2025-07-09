import '@testing-library/jest-dom'

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(className: string): R
      toHaveBeenCalledWith(...args: any[]): R
      toHaveLength(length: number): R
      toBeDisabled(): R
      toHaveBeenCalled(): R
      toHaveTextContent(text: string): R
      toBeVisible(): R
      toBeEmpty(): R
      toContainElement(element: HTMLElement | null): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveStyle(css: Record<string, any>): R
      toBeChecked(): R
      toHaveFocus(): R
      toBeEnabled(): R
      toContainHTML(html: string): R
      toHaveValue(value: string | string[] | number): R
      toHaveFormValues(values: Record<string, any>): R
      toMatchSnapshot(): R
    }
    
    interface ExpectStatic {
      anything(): any
      any(constructor: Function): any
      arrayContaining(array: Array<any>): any
      assertions(num: number): void
      hasAssertions(): void
      not: ExpectStatic
      objectContaining(obj: any): any
      stringContaining(str: string): any
      stringMatching(str: string | RegExp): any
    }
  }
}

export {}