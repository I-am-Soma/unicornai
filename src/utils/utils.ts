function removeSymbols(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeSymbols);
  }
  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (typeof key === 'string') { // Ignorar claves que sean símbolos
      const value = obj[key];
      if (typeof value !== 'symbol') {
        newObj[key] = removeSymbols(value);
      }
    }
  }
  return newObj;
}