class Operation {
  constructor(operationDate, operationType, SHAREId) {
    this.operationDate = operationDate;
    this.operationType = operationType;
    this.middlePrice = 0.0;
    this.middleQuantity = 0.0;
    this.resultEarned = 0.0;
    this.accumulatedLoss = 0.0;
    this.irValue = 0.0;
    this.SHAREId = SHAREId;
  }
  getOperationDate() {
    return this.operationDate;
  }
  getMiddlePrice() {
    return this.middlePrice;
  }
  getMiddleQuantity() {
    return this.middleQuantity;
  }
  getResultEarned() {
    return this.resultEarned;
  }
  getSHAREId() {
    return this.SHAREId;
  }
  getIrValue() {
    return this.irValue;
  }
  async getLastOperation() {
    try {
      return await dbOperations.findOne({
        where: {
          SHAREId: this.SHAREId,
        },
        order: [["createdAt", "DESC"]],
      });
    } catch (error) {
      return error;
    }
  }

  calculateIR() {
    const minValue = Min(this.resultEarned, this.accumulatedLoss);
    const fullValue = this.resultEarned - minValue;
    const parcialValue = (fullValue * 15) / 100;
    this.irValue = fullValue * parcialValue;
    this.accumulatedLoss += minValue;
  }
  calculateMiddlePrice(purchasePrice, purchaseQuantity, brockerageFee) {
    const lastValues = this.getLastOperation().catch((error) => {
      return null;
    })
    .then((result) => {
      return result;
    });
    const initialMiddlePrice =
      lastValues == null ? 0 : parseFloat(lastValues.middlePrice);

    const initialMiddleQuantity =
      lastValues == null ? 0 : parseFloat(lastValues.middleQuantity);
    this.middlePrice =
      (initialMiddlePrice * initialMiddleQuantity +
        purchasePrice * purchaseQuantity +
        brockerageFee) /
      (initialMiddleQuantity + purchaseQuantity);
    this.calculateMiddleQuantity(purchaseQuantity,lastValues);
  }
  calculateMiddleQuantity(operationQuantity, lastValues) {
    const initialMiddleQuantity = lastValues == null?0.0:lastValues.middleQuantity;
    if (this.operationType === "purchase") {
      this.middleQuantity = initialMiddleQuantity + operationQuantity;
    } else {
      this.middleQuantity = initialMiddleQuantity - operationQuantity;
    }
  }
  calculateResultEarned(salePrice, saleQuantity, brockerageFee) {
    const lastValues = this.getLastOperation().catch((error) => {
      return null;
    })
    .then((result) => {
      return result;
    });
    const initialMiddlePrice = lastValues == null?0.0:lastValues.middlePrice;
    this.resultEarned =
      (salePrice - initialMiddlePrice) * saleQuantity -
      brockerageFee;
    if (this.resultEarned < 0) {
      this.addtoAccumulatedLoss(lastValues);
    } else {
      this.calculateIR();
    }
    this.calculateMiddleQuantity(saleQuantity,lastValues);
  }
  addtoAccumulatedLoss(lastValues) {
    this.accumulatedLoss =
      lastValues === null
        ? 0.0
        : parseFloat(lastValues.accumulatedLoss);
    this.accumulatedLoss -= this.resultEarned;
  }
}
module.exports = Operation;
