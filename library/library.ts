const getColorByStatus = (typeOfStatus: number): string => {
  switch (typeOfStatus) {
    case 1:
      return 'yellow';
    case 2:
      return 'grey';
    case 4:
      return 'blue';
    case 3:
      return 'green';
    default:
      return 'red';
  }
};

export { getColorByStatus };
