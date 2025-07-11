module.exports.calculateLeasing = (data) => {
  const constantsConditionActions = {
    payment: "payment",
    percent: "percent",
    term: "term"
  };

  // Функция нормализации даты
  function parseDate(dateString) {
    if (!dateString) return dateString;
    if (dateString.includes('.')) {
      const [day, month, year] = dateString.split('.');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  }

  function generatePaymentDate(startDate, monthIndex) {
    if (!startDate) {
      return monthIndex;
    }
    const date = new Date(parseDate(startDate)); // Используем парсер
    date.setMonth(date.getMonth() + monthIndex);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  function additionHundredth(num1, num2, sign) {
    if (num1 === undefined || num2 === undefined || isNaN(num1) || isNaN(num2)) {
      return 0;
    }
    num1 = parseFloat(num1);
    num2 = parseFloat(num2);
    let result;
    switch (sign) {
      case "-":
        result = (num1 * 100 - num2 * 100) / 100;
        break;
      case "*":
        result = (num1 * 100 * num2 * 100) / 10000;
        break;
      case "/":
        result = num2 !== 0 ? (num1 * 100) / (num2 * 100) : 0;
        break;
      default:
        result = (num1 * 100 + num2 * 100) / 100;
        break;
    }
    return parseFloat(result.toFixed(2));
  }

  function getRedemptionValue({ redemptionPercent, sum }) {
    return (sum / 100) * redemptionPercent;
  }

  function getPercent({ percent, value }) {
    if (value === undefined || isNaN(value)) return { withNds: 0, value: 0, nds: 0 };
    let valueOfPercent;
    let originValue;
    if (percent !== 0) {
      valueOfPercent = +((value * percent) / (100 + percent)).toFixed(2);
      originValue = +(value - valueOfPercent).toFixed(2);
    } else {
      valueOfPercent = 0;
      originValue = value;
    }
    return {
      withNds: value,
      value: originValue,
      nds: valueOfPercent,
    };
  }

  function addPercent({ percent, value }) {
    if (value === undefined || isNaN(value)) return { withNds: 0, value: 0, nds: 0 };
    let valueOfPercent;
    let originValue;
    if (percent !== 0) {
      valueOfPercent = +((value * percent) / 100).toFixed(2);
      originValue = +(value + valueOfPercent).toFixed(2);
    } else {
      valueOfPercent = 0;
      originValue = value;
    }
    return {
      withNds: originValue,
      value: value,
      nds: valueOfPercent,
    };
  }

  function getFirstPayment({
    nds,
    firstPayment,
    balance,
    redemptionValue,
    clientNDSCalc,
  }) {
    const monthlyPayment = getPercent({
      percent: clientNDSCalc ? nds : 0,
      value: firstPayment,
    });
    const principalPayment = getPercent({
      percent: clientNDSCalc ? nds : 0,
      value: firstPayment,
    });
    return {
      month: 0,
      payment: firstPayment,
      principal: firstPayment,
      interest: 0,
      monthlyPayment: monthlyPayment,
      interestPayment: { withNds: 0, value: 0, nds: 0 },
      principalPayment: principalPayment,
      balance: additionHundredth(balance / 100, redemptionValue, "+"),
    };
  }

  function getLastPayment({
    nds,
    redemptionValue,
    schedule,
    firstPaymentDate,
    clientNDSCalc = true,
    leasingNDSCalc = true,
  }) {
    const monthlyPayment = getPercent({
      percent: clientNDSCalc ? nds : 0,
      value: redemptionValue,
    });
    const principalPayment = getPercent({
      percent: clientNDSCalc ? nds : 0,
      value: redemptionValue,
    });
    return {
      month: schedule.length,
      paymentDate: generatePaymentDate(firstPaymentDate, schedule.length),
      payment: redemptionValue,
      principal: redemptionValue,
      interest: 0,
      monthlyPayment: monthlyPayment,
      interestPayment: { withNds: 0, value: 0, nds: 0 },
      principalPayment: principalPayment,
      balance: 0,
    };
  }

  function getFinalResult({ schedule }) {
    const allPayment = {
      month: "итого",
      paymentDate: "-",
      payment: 0,
      principal: 0,
      interest: 0,
      monthlyPayment: { withNds: 0, value: 0, nds: 0 },
      principalPayment: { withNds: 0, value: 0, nds: 0 },
      interestPayment: { withNds: 0, value: 0, nds: 0 },
      balance: 0
    };
    schedule.forEach((month) => {
      if (!month.monthlyPayment || !month.principalPayment || !month.interestPayment) return;
      allPayment.payment = additionHundredth(
        month.payment,
        allPayment.payment,
        "+"
      );
      allPayment.principal = additionHundredth(
        month.principal,
        allPayment.principal,
        "+"
      );
      allPayment.interest = additionHundredth(
        month.interest,
        allPayment.interest,
        "+"
      );
      allPayment.monthlyPayment.withNds = additionHundredth(
        month.monthlyPayment.withNds,
        allPayment.monthlyPayment.withNds,
        "+"
      );
      allPayment.principalPayment.value = additionHundredth(
        month.principalPayment.value,
        allPayment.principalPayment.value,
        "+"
      );
      allPayment.principalPayment.nds = additionHundredth(
        month.principalPayment.nds,
        allPayment.principalPayment.nds,
        "+"
      );
      allPayment.interestPayment.value = additionHundredth(
        month.interestPayment.value,
        allPayment.interestPayment.value,
        "+"
      );
      allPayment.interestPayment.nds = additionHundredth(
        month.interestPayment.nds,
        allPayment.interestPayment.nds,
        "+"
      );
      allPayment.monthlyPayment.value = additionHundredth(
        month.monthlyPayment.value,
        allPayment.monthlyPayment.value,
        "+"
      );
      allPayment.monthlyPayment.nds = additionHundredth(
        month.monthlyPayment.nds,
        allPayment.monthlyPayment.nds,
        "+"
      );
      allPayment.balance = additionHundredth(
        month.balance || 0,
        allPayment.balance,
        "+"
      );
    });
    return allPayment;
  }

  function checkFinalAllPaymentAndNds({
    schedule,
    nds,
    sum,
    clientNDSCalc = true,
  }) {
    const objectSum = getPercent({
      percent: clientNDSCalc ? nds : 0,
      value: sum,
    });
    const difference = additionHundredth(
      schedule[schedule.length - 1].principalPayment.value,
      objectSum.value,
      "-"
    );
    return schedule.map((item) => {
      if (item.type === "lastMonthly") {
        item.principalPayment.value = additionHundredth(
          item.principalPayment.value,
          difference,
          "-"
        );
        item.principalPayment.nds = additionHundredth(
          item.principalPayment.nds,
          difference,
          "+"
        );
        item.monthlyPayment.value = additionHundredth(
          item.monthlyPayment.value,
          difference,
          "-"
        );
        item.monthlyPayment.nds = additionHundredth(
          item.monthlyPayment.nds,
          difference,
          "+"
        );
      }
      return item;
    });
  }

  class Annuity {
    constructor({
      sum,
      firstPayment,
      percent,
      term,
      firstPaymentDate,
      redemptionPercent,
      nds,
      condition,
      individCheck,
      leasingCheck,
    }) {
      this.sum = sum;
      this.firstPayment = firstPayment;
      this.percent = percent;
      this.term = term;
      this.firstPaymentDate = firstPaymentDate;
      this.redemptionPercent = redemptionPercent;
      this.nds = nds;
      this.condition = condition || [];
      this.clientNDSCalc = individCheck;
      this.leasingNDSCalc = leasingCheck;
      this.redemptionValue = getRedemptionValue({
        sum: sum,
        redemptionPercent: redemptionPercent,
      });
      this.kef = Annuity.getRatePerMonth({ percent: this.percent });
      this.monthlyAnnuity = Annuity.getRateAnnuity({
        kef: this.kef,
        term: this.term,
      });
      this.financedAmount = this.sum - this.firstPayment - this.redemptionValue;
      this.monthlyPayment = +(this.financedAmount * this.monthlyAnnuity).toFixed(2) * 100;
      this.balance = this.financedAmount * 100;
    }

    static getRatePerMonth({ percent }) {
      return percent / 12 / 100;
    }

    static getRateAnnuity({ kef, term }) {
      return (kef * (1 + kef) ** term) / ((1 + kef) ** term - 1);
    }

    static calculateInterestPayment({ balance, kef }) {
      return +((balance / 100) * kef).toFixed(2) * 100;
    }

    generateSchedule() {
      let schedule = [];
      const firstPayment = getFirstPayment({
        nds: this.nds,
        firstPayment: this.firstPayment,
        balance: this.balance,
        redemptionValue: this.redemptionValue,
        clientNDSCalc: this.clientNDSCalc,
      });
      firstPayment.month = 0;
      firstPayment.paymentDate = generatePaymentDate(this.firstPaymentDate, 0);
      schedule.push(firstPayment);
      for (let i = 1; i <= this.term; i++) {
        let interestPayment = Annuity.calculateInterestPayment({
          balance: this.balance + this.redemptionValue * 100,
          kef: this.kef,
        });
        let principalPayment = this.monthlyPayment - interestPayment;
        if (!this.condition.find((item) => +item.term === i)) {
          this.balance -= principalPayment;
        }
        this.condition.forEach((item) => {
          if (+item.term === i) {
            this.applyConditions({
              item: item.conditionData,
              iteration: i,
            });
          }
        });
        if (i !== this.term) {
          const interestBase = +interestPayment.toFixed(0) / 100;
          const principalBase = +principalPayment.toFixed(0) / 100;
          const interestPaymentWithNds = getPercent({
            percent: this.leasingNDSCalc ? this.nds : 0,
            value: interestBase,
          });
          const principalPaymentWithNds = getPercent({
            percent: this.clientNDSCalc ? this.nds : 0,
            value: principalBase,
          });
          const monthlyPaymentWithNds = {
            withNds: additionHundredth(
              interestPaymentWithNds.withNds,
              principalPaymentWithNds.withNds,
              "+"
            ),
            value: additionHundredth(
              interestBase,
              principalBase,
              "+"
            ),
            nds: additionHundredth(
              interestPaymentWithNds.nds,
              principalPaymentWithNds.nds,
              "+"
            ),
          };
          schedule.push({
            month: i,
            paymentDate: generatePaymentDate(this.firstPaymentDate, i),
            payment: monthlyPaymentWithNds.withNds,
            principal: principalBase,
            interest: interestBase,
            monthlyPayment: monthlyPaymentWithNds,
            interestPayment: interestPaymentWithNds,
            principalPayment: principalPaymentWithNds,
            balance: +this.balance.toFixed(0) / 100 + this.redemptionValue,
          });
        } else {
          if (this.balance < 0) {
            principalPayment -= Math.abs(this.balance);
            interestPayment += Math.abs(this.balance);
            this.balance += Math.abs(this.balance);
          } else {
            principalPayment += Math.abs(this.balance);
            interestPayment -= Math.abs(this.balance);
            this.balance -= Math.abs(this.balance);
          }
          const interestBase = interestPayment / 100;
          const principalBase = principalPayment / 100;
          const interestPaymentWithNds = getPercent({
            percent: this.leasingNDSCalc ? this.nds : 0,
            value: interestBase,
          });
          const principalPaymentWithNds = getPercent({
            percent: this.clientNDSCalc ? this.nds : 0,
            value: principalBase,
          });
          const monthlyPaymentWithNds = {
            withNds: additionHundredth(
              interestPaymentWithNds.withNds,
              principalPaymentWithNds.withNds,
              "+"
            ),
            value: additionHundredth(
              interestBase,
              principalBase,
              "+"
            ),
            nds: additionHundredth(
              interestPaymentWithNds.nds,
              principalPaymentWithNds.nds,
              "+"
            ),
          };
          schedule.push({
            type: "lastMonthly",
            month: i,
            paymentDate: generatePaymentDate(this.firstPaymentDate, i),
            payment: monthlyPaymentWithNds.withNds,
            principal: principalBase,
            interest: interestBase,
            monthlyPayment: monthlyPaymentWithNds,
            interestPayment: interestPaymentWithNds,
            principalPayment: principalPaymentWithNds,
            balance: this.balance / 100 + this.redemptionValue,
          });
        }
      }
      schedule.push(
        getLastPayment({
          nds: this.nds,
          redemptionValue: this.redemptionValue,
          schedule: schedule,
          firstPaymentDate: this.firstPaymentDate,
          clientNDSCalc: this.clientNDSCalc,
          leasingNDSCalc: this.leasingNDSCalc,
        })
      );
      const finalResult = getFinalResult({ schedule: schedule });
      schedule.push(finalResult);
      schedule = checkFinalAllPaymentAndNds({
        schedule: schedule,
        nds: this.nds,
        sum: this.sum,
        clientNDSCalc: this.clientNDSCalc,
      });
      schedule.pop();
      schedule.push(getFinalResult({ schedule: schedule }));
      return schedule;
    }

    applyConditions({ item, iteration }) {
      let interestPayment = 0;
      let principalPayment = 0;

      const actionPayment = item.find(
        (item) => item.action === constantsConditionActions.payment
      )?.data;
      const actionPercent = item.find(
        (item) => item.action === constantsConditionActions.percent
      )?.data;
      const actionTerm = item.find(
        (item) => item.action === constantsConditionActions.term
      )?.data;

      if (!!actionPayment && !!actionPercent && !!actionTerm) {
        this.term = +actionTerm.end;
        this.kef = Annuity.getRatePerMonth({
          percent: +actionPercent.percent,
        });
        this.monthlyAnnuity = Annuity.getRateAnnuity({
          kef: this.kef,
          term: this.term - iteration + 1,
        });
        interestPayment = +((this.balance / 100) * this.kef).toFixed(2) * 100;
        principalPayment = +actionPayment.sum * 100 - interestPayment;
        this.balance -= principalPayment;
        this.monthlyPayment = +((this.balance / 100) * this.monthlyAnnuity).toFixed(2) * 100;
        return;
      }
      if (!!actionPayment && !!actionTerm && !actionPercent) {
        this.term = +actionTerm.end;
        principalPayment = actionPayment.sum * 100 - interestPayment;
        this.balance -= principalPayment;
        this.monthlyAnnuity = Annuity.getRateAnnuity({
          kef: this.kef,
          term: this.term - iteration,
        });
        this.monthlyPayment = +((this.balance / 100) * this.monthlyAnnuity).toFixed(2) * 100;
        return;
      }
      if (!!actionPercent && !!actionTerm && !actionPayment) {
        this.term = +actionTerm.end;
        this.kef = Annuity.getRatePerMonth({
          percent: actionPercent.percent,
        });
        this.monthlyAnnuity = Annuity.getRateAnnuity({
          kef: this.kef,
          term: this.term - iteration + 1,
        });
        this.monthlyPayment = +((this.balance / 100) * this.monthlyAnnuity).toFixed(2) * 100;
        interestPayment = +((this.balance / 100) * this.kef).toFixed(2) * 100;
        principalPayment = this.monthlyPayment - interestPayment;
        this.balance -= principalPayment;
        return;
      }
      if (!!actionPayment && !!actionPercent && !actionTerm) {
        this.kef = Annuity.getRatePerMonth({
          percent: +actionPercent.percent,
        });
        this.monthlyAnnuity = Annuity.getRateAnnuity({
          kef: this.kef,
          term: this.term - iteration,
        });
        interestPayment = +((this.balance / 100) * this.kef).toFixed(2) * 100;
        principalPayment = +actionPayment.sum * 100 - interestPayment;
        this.balance -= principalPayment;
        this.monthlyPayment = +((this.balance / 100) * this.monthlyAnnuity).toFixed(2) * 100;
        return;
      }
      if (!!actionPayment && !actionPercent && !actionTerm) {
        principalPayment = actionPayment.sum * 100 - interestPayment;
        this.balance -= principalPayment;
        this.monthlyAnnuity = Annuity.getRateAnnuity({
          kef: this.kef,
          term: this.term - iteration,
        });
        this.monthlyPayment = +((this.balance / 100) * this.monthlyAnnuity).toFixed(2) * 100;
        return;
      }
      if (!!actionPercent && !actionPayment && !actionTerm) {
        this.kef = Annuity.getRatePerMonth({
          percent: actionPercent.percent,
        });
        this.monthlyAnnuity = Annuity.getRateAnnuity({
          kef: this.kef,
          term: this.term - iteration + 1,
        });
        this.monthlyPayment = +((this.balance / 100) * this.monthlyAnnuity).toFixed(2) * 100;
        interestPayment = +((this.balance / 100) * this.kef).toFixed(2) * 100;
        principalPayment = this.monthlyPayment - interestPayment;
        this.balance -= principalPayment;
        return;
      }
      if (!!actionTerm && !actionPayment && !actionPercent) {
        this.term = +actionTerm.end;
        this.monthlyAnnuity = Annuity.getRateAnnuity({
          kef: this.kef,
          term: this.term - iteration + 1,
        });
        this.monthlyPayment = +((this.balance / 100) * this.monthlyAnnuity).toFixed(2) * 100;
        interestPayment = +((this.balance / 100) * this.kef).toFixed(2) * 100;
        principalPayment = this.monthlyPayment - interestPayment;
        this.balance -= principalPayment;
        return;
      }
    }
  }

  class Differentiated {
    constructor({
      sum,
      firstPayment,
      percent,
      term,
      firstPaymentDate,
      redemptionPercent,
      nds,
      condition,
      individCheck,
      leasingCheck,
    }) {
      this.sum = sum;
      this.firstPayment = firstPayment;
      this.percent = percent;
      this.term = term;
      this.firstPaymentDate = firstPaymentDate;
      this.redemptionPercent = redemptionPercent;
      this.nds = nds;
      this.condition = condition || [];
      this.clientNDSCalc = individCheck;
      this.leasingNDSCalc = leasingCheck;
      this.redemptionValue = getRedemptionValue({
        sum: sum,
        redemptionPercent: redemptionPercent,
      });
      this.financedAmount = this.sum - this.firstPayment - this.redemptionValue;
      this.balance = this.financedAmount * 100;
      this.principalPayment = Differentiated.calculatePrincipalPayment({
        sum: this.financedAmount,
        term: this.term,
      }) * 100;
    }

    static calculatePrincipalPayment({ sum, term }) {
      return +(sum / term).toFixed(2);
    }

    static calculateInterestPayment({ balance, percent }) {
      return +((((balance * percent) / 365) * 30) / 100).toFixed(0);
    }

    generateSchedule() {
      let schedule = [];
      const firstPayment = getFirstPayment({
        nds: this.nds,
        firstPayment: this.firstPayment,
        balance: this.balance,
        redemptionValue: this.redemptionValue,
        clientNDSCalc: this.clientNDSCalc,
      });
      firstPayment.month = 0;
      firstPayment.paymentDate = generatePaymentDate(this.firstPaymentDate, 0);
      schedule.push(firstPayment);
      for (let month = 1; month <= this.term; month++) {
        this.condition.forEach((item) => {
          if (+item.term === month) {
            this.applyConditions({
              item: item.conditionData,
              iteration: month,
            });
          }
        });
        if (month !== this.term) {
          const interestPayment = Differentiated.calculateInterestPayment(
            {
              balance: this.balance + this.redemptionValue * 100,
              percent: this.percent,
            }
          );
          const interestBase = interestPayment / 100;
          const principalBase = this.principalPayment / 100;
          const interestPaymentWithNds = addPercent({
            percent: this.leasingNDSCalc ? this.nds : 0,
            value: interestBase,
          });
          const principalPaymentWithNds = getPercent({
            percent: this.clientNDSCalc ? this.nds : 0,
            value: principalBase,
          });
          const monthlyPaymentWithNds = {
            withNds: additionHundredth(
              interestPaymentWithNds.withNds,
              principalPaymentWithNds.withNds,
              "+"
            ),
            value: additionHundredth(
              interestBase,
              principalBase,
              "+"
            ),
            nds: additionHundredth(
              interestPaymentWithNds.nds,
              principalPaymentWithNds.nds,
              "+"
            ),
          };
          this.balance = this.balance - this.principalPayment;
          schedule.push({
            month: month,
            paymentDate: generatePaymentDate(this.firstPaymentDate, month),
            payment: monthlyPaymentWithNds.withNds,
            principal: principalBase,
            interest: interestBase,
            monthlyPayment: monthlyPaymentWithNds,
            interestPayment: interestPaymentWithNds,
            principalPayment: principalPaymentWithNds,
            balance: +this.balance.toFixed(0) / 100 + this.redemptionValue,
          });
          this.principalPayment = +Differentiated.calculatePrincipalPayment({
            sum: this.balance,
            term: this.term - month,
          }).toFixed(0);
        } else {
          let interestPayment = Differentiated.calculateInterestPayment({
            balance: this.balance,
            percent: this.percent,
          });
          this.balance = this.balance - this.principalPayment;
          if (this.balance < 0) {
            this.principalPayment -= Math.abs(this.balance);
            interestPayment += Math.abs(this.balance);
            this.balance += Math.abs(this.balance);
          } else {
            this.principalPayment += Math.abs(this.balance);
            interestPayment -= Math.abs(this.balance);
            this.balance -= Math.abs(this.balance);
          }
          const interestBase = interestPayment / 100;
          const principalBase = this.principalPayment / 100;
          const interestPaymentWithNds = addPercent({
            percent: this.leasingNDSCalc ? this.nds : 0,
            value: interestBase,
          });
          const principalPaymentWithNds = getPercent({
            percent: this.clientNDSCalc ? this.nds : 0,
            value: principalBase,
          });
          const monthlyPaymentWithNds = {
            withNds: additionHundredth(
              interestPaymentWithNds.withNds,
              principalPaymentWithNds.withNds,
              "+"
            ),
            value: additionHundredth(
              interestBase,
              principalBase,
              "+"
            ),
            nds: additionHundredth(
              interestPaymentWithNds.nds,
              principalPaymentWithNds.nds,
              "+"
            ),
          };
          schedule.push({
            type: "lastMonthly",
            month: month,
            paymentDate: generatePaymentDate(this.firstPaymentDate, month),
            payment: monthlyPaymentWithNds.withNds,
            principal: principalBase,
            interest: interestBase,
            monthlyPayment: monthlyPaymentWithNds,
            interestPayment: interestPaymentWithNds,
            principalPayment: principalPaymentWithNds,
            balance: this.balance / 100 + this.redemptionValue,
          });
        }
      }
      schedule.push(
        getLastPayment({
          nds: this.nds,
          redemptionValue: this.redemptionValue,
          schedule: schedule,
          firstPaymentDate: this.firstPaymentDate,
          clientNDSCalc: this.clientNDSCalc,
          leasingNDSCalc: this.leasingNDSCalc,
        })
      );
      const finalResult = getFinalResult({ schedule: schedule });
      schedule.push(finalResult);
      schedule = checkFinalAllPaymentAndNds({
        schedule: schedule,
        nds: this.nds,
        sum: this.sum,
        clientNDSCalc: this.clientNDSCalc,
      });
      schedule.pop();
      schedule.push(getFinalResult({ schedule: schedule }));
      return schedule;
    }

    applyConditions({ item, iteration }) {
      const actionPayment = item.find(
        (item) => item.action === constantsConditionActions.payment
      )?.data;
      const actionPercent = item.find(
        (item) => item.action === constantsConditionActions.percent
      )?.data;
      const actionTerm = item.find(
        (item) => item.action === constantsConditionActions.term
      )?.data;
      if (!!actionPercent) {
        this.percent = actionPercent.percent;
      }
      if (!!actionPayment) {
        const interestPayment = Differentiated.calculateInterestPayment({
          balance: this.balance,
          percent: this.percent,
        }).toFixed(0);
        this.principalPayment = actionPayment.sum * 100 - interestPayment;
      }
      if (!!actionTerm) {
        this.term = +actionTerm.end;
      }
    }
  }

  let result;
  if (data.calculationType === "annuity") {
    const calculator = new Annuity({
      sum: data.sum,
      firstPayment: data.firstPayment,
      percent: data.percent,
      term: data.term,
      firstPaymentDate: data.firstPaymentDate,
      redemptionPercent: data.redemptionPercent,
      nds: data.nds,
      condition: data.conditions || [],
      individCheck: data.clientNDSCalc,
      leasingCheck: data.leasingNDSCalc
    });
    result = calculator.generateSchedule();
  } 
  else if (data.calculationType === "differentiated") {
    const calculator = new Differentiated({
      sum: data.sum,
      firstPayment: data.firstPayment,
      percent: data.percent,
      term: data.term,
      firstPaymentDate: data.firstPaymentDate,
      redemptionPercent: data.redemptionPercent,
      nds: data.nds,
      condition: data.conditions || [],
      individCheck: data.clientNDSCalc,
      leasingCheck: data.leasingNDSCalc
    });
    result = calculator.generateSchedule();
  }
  else {
    throw new Error("Unknown calculation type");
  }
  return result;
};