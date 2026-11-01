/*
 * Trayecto · Datos del plan de estudios
 * Fuente: "PROFESORADO MATEMATICA - PLAN DE ESTUDIOS" (PDF de 2 páginas).
 * La información se transcribe sin agregar materias, cargas horarias ni
 * períodos que no figuren en el documento.
 */
(function () {
  "use strict";

  var req = function (subjects, years) {
    return {
      subjects: subjects || [],
      years: years || []
    };
  };

  var subjects = [
    { number: 1, name: "Pedagogía", year: 1, code: "M", period: null },
    { number: 2, name: "Geometría 1", year: 1, code: "M", period: null },
    { number: 3, name: "Cálculo 1", year: 1, code: "M", period: null },
    {
      number: 4,
      name: "Ciencia, Tecnología y sociedad y Educación Matemática",
      year: 1,
      code: "S",
      period: null
    },
    { number: 5, name: "Aritmética y Álgebra 1", year: 1, code: "M", period: null },
    { number: 6, name: "Estadística y Probabilidad 1", year: 1, code: "M", period: null },
    { number: 7, name: "Didáctica y su Currículum", year: 1, code: "T", period: null },
    { number: 8, name: "Modelización Matemática 1", year: 1, code: "T", period: null },
    { number: 9, name: "Taller de Docencia I", year: 1, code: "T", period: null },
    { number: 10, name: "Psicología y Educación", year: 2, code: "M", period: null },
    { number: 11, name: "Geometría 2", year: 2, code: "M", period: null },
    { number: 12, name: "Cálculo 2", year: 2, code: "M", period: null },
    { number: 13, name: "Física 1", year: 2, code: "M", period: null },
    { number: 14, name: "Aritmética y Álgebra 2", year: 2, code: "M", period: null },
    { number: 15, name: "Instituciones Educativas", year: 2, code: "M", period: null },
    { number: 16, name: "Didáctica de la Matemática 1", year: 2, code: "M", period: null },
    {
      number: 17,
      name: "Historia y Política Educativa Argentina",
      year: 2,
      code: "M",
      period: null
    },
    { number: 18, name: "Modelización Matemática 2", year: 2, code: "T", period: null },
    { number: 19, name: "Taller de Docencia 2", year: 2, code: "T", period: null },
    { number: 20, name: "Sujeto de la Educación Secundaria", year: 3, code: "M", period: null },
    { number: 21, name: "Geometría 3", year: 3, code: "M", period: null },
    { number: 22, name: "Cálculo 3", year: 3, code: "M", period: null },
    { number: 23, name: "Física 2", year: 3, code: "M", period: null },
    { number: 24, name: "Aritmética y Álgebra 3", year: 3, code: "M", period: null },
    { number: 25, name: "Metodología de la investigación", year: 3, code: "S", period: null },
    { number: 26, name: "Didáctica de la Matemática 2", year: 3, code: "M", period: null },
    { number: 27, name: "Filosofía", year: 3, code: "M", period: null },
    { number: 28, name: "Modelización Matemática 3", year: 3, code: "T", period: null },
    { number: 29, name: "Taller de Docencia 3", year: 3, code: "T", period: null },
    { number: 30, name: "Geometría 4", year: 4, code: "M", period: null },
    { number: 31, name: "Cálculo 4", year: 4, code: "M", period: null },
    { number: 32, name: "Aritmética y Álgebra 4", year: 4, code: "M", period: null },
    { number: 33, name: "Modelización Matemática 4", year: 4, code: "T", period: null },
    { number: 34, name: "Estadística y Probabilidad 2", year: 4, code: "M", period: null },
    {
      number: 35,
      name: "Epistemología e Historia de la Matemática",
      year: 4,
      code: "M",
      period: null
    },
    { number: 36, name: "Prácticas de Investigación", year: 4, code: "M", period: null },
    { number: 37, name: "Ética y Trabajo Docente", year: 4, code: "M", period: null },
    { number: 38, name: "ESI: Educación Sexual Integral", year: 4, code: "S", period: null },
    {
      number: 39,
      name: "UDI: Unidad de Definición Institucional",
      year: 4,
      code: "S",
      period: null
    },
    { number: 40, name: "Taller de Docencia 4", year: 4, code: "T", period: null }
  ];

  var correlations = {
    1: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req()
    },
    2: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req()
    },
    3: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req()
    },
    4: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req()
    },
    5: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req()
    },
    6: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req()
    },
    7: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req()
    },
    8: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req()
    },
    9: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req()
    },
    10: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req()
    },
    11: {
      cursarRegular: req([2, 5]),
      cursarPromocion: req(),
      finalRegular: req([2, 5]),
      finalPromocion: req()
    },
    12: {
      cursarRegular: req([3, 5]),
      cursarPromocion: req(),
      finalRegular: req([3, 5]),
      finalPromocion: req()
    },
    13: {
      cursarRegular: req([3, 5]),
      cursarPromocion: req(),
      finalRegular: req([3, 5]),
      finalPromocion: req()
    },
    14: {
      cursarRegular: req([2, 5]),
      cursarPromocion: req(),
      finalRegular: req([2, 5]),
      finalPromocion: req()
    },
    15: {
      cursarRegular: req([1]),
      cursarPromocion: req(),
      finalRegular: req([1]),
      finalPromocion: req()
    },
    16: {
      cursarRegular: req([7]),
      cursarPromocion: req(),
      finalRegular: req([7]),
      finalPromocion: req()
    },
    17: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req([1])
    },
    18: {
      cursarRegular: req([2, 3, 5]),
      cursarPromocion: req([8]),
      finalRegular: req(),
      finalPromocion: req([8])
    },
    19: {
      cursarRegular: req([7, 8]),
      cursarPromocion: req([9]),
      finalRegular: req(),
      finalPromocion: req()
    },
    20: {
      cursarRegular: req([10]),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req([10])
    },
    21: {
      cursarRegular: req([11, 14]),
      cursarPromocion: req([2, 5]),
      finalRegular: req(),
      finalPromocion: req([11, 14])
    },
    22: {
      cursarRegular: req([11, 12]),
      cursarPromocion: req([3, 5]),
      finalRegular: req(),
      finalPromocion: req([11, 12])
    },
    23: {
      cursarRegular: req([12, 13]),
      cursarPromocion: req([3, 5]),
      finalRegular: req(),
      finalPromocion: req([12, 13])
    },
    24: {
      cursarRegular: req([11, 14]),
      cursarPromocion: req([2, 5]),
      finalRegular: req(),
      finalPromocion: req([11, 14])
    },
    25: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req()
    },
    26: {
      cursarRegular: req([16]),
      cursarPromocion: req([7]),
      finalRegular: req(),
      finalPromocion: req([16])
    },
    27: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req()
    },
    28: {
      cursarRegular: req([11, 12, 14]),
      cursarPromocion: req([18]),
      finalRegular: req([11, 12, 14]),
      finalPromocion: req([18])
    },
    29: {
      cursarRegular: req([11, 12, 14]),
      cursarPromocion: req([16, 19], [1]),
      finalRegular: req(),
      finalPromocion: req()
    },
    30: {
      cursarRegular: req([21, 24]),
      cursarPromocion: req([11, 14]),
      finalRegular: req(),
      finalPromocion: req([21, 24])
    },
    31: {
      cursarRegular: req([22, 23]),
      cursarPromocion: req([11, 12]),
      finalRegular: req(),
      finalPromocion: req([22, 23])
    },
    32: {
      cursarRegular: req([21, 24]),
      cursarPromocion: req([11, 14]),
      finalRegular: req(),
      finalPromocion: req([21, 24])
    },
    33: {
      cursarRegular: req([21, 22, 24]),
      cursarPromocion: req([28]),
      finalRegular: req(),
      finalPromocion: req([28])
    },
    34: {
      cursarRegular: req([22]),
      cursarPromocion: req([6, 12]),
      finalRegular: req(),
      finalPromocion: req([22])
    },
    35: {
      cursarRegular: req([21, 22, 23]),
      cursarPromocion: req([11, 12, 13]),
      finalRegular: req(),
      finalPromocion: req([21, 22, 23])
    },
    36: {
      cursarRegular: req([25]),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req([25])
    },
    37: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req([27])
    },
    38: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req([20])
    },
    39: {
      cursarRegular: req(),
      cursarPromocion: req(),
      finalRegular: req(),
      finalPromocion: req()
    },
    40: {
      cursarRegular: req([20, 21, 22, 23]),
      cursarPromocion: req([26, 29], [1, 2]),
      finalRegular: req(),
      finalPromocion: req()
    }
  };

  subjects.forEach(function (subject) {
    subject.correlations = correlations[subject.number];
  });

  window.TRAYECTO_PLAN = {
    career: "Profesorado de Matemática",
    institution: "Escuela Normal Superior N°32 «Gral. José de San Martín»",
    durationYears: 4,
    totalSubjects: subjects.length,
    sourceName: "PROFESORADO MATEMATICA - PLAN DE ESTUDIOS",
    sourceNote:
      "Datos transcriptos del plan de estudios oficial compartido. El documento no especifica cargas horarias ni asigna materias a cuatrimestres.",
    typeLabels: {
      M: "Materia",
      T: "Taller",
      S: "Seminario"
    },
    subjects: subjects
  };
})();
