class TypeDate {
    constructor(dateStr, mode = TypeDate.Timestamp) {
        this.date = dateStr ? new Date(dateStr) : new Date();
        this.mode = mode;
        if (isNaN(this.date)) {
            throw Error('Please provide a valid date object/string or pass null/undefined for now()');
        }
    }
    get() {
        switch (this.mode) {
            case TypeDate.DateOnly:
                return this.getDateOnly();
            case TypeDate.TimeOnly:
                return this.getTimeOnly();
            default:
                return this.getTimestamp();
        }
    }
    getDateOnly(noQuote = false) {
        const combined = `${this._yr()}-${this._mn()}-${this._dt()}`;
        return noQuote ? combined : `'${combined}'`;
    }
    getTimeOnly(noQuote = false) {
        const combined = `${this._hr()}:${this._min()}:${this._sec()}`;
        return noQuote ? combined : `'${combined}'`;
    }
    getTimestamp() {
        return `'${this.getDateOnly(1)} ${this.getTimeOnly(1)}'`;
    }
    _yr() {
        return this.date.getFullYear();
    }
    _mn() {
        return this._pad(this.date.getMonth() + 1);
    }
    _dt() {
        return this._pad(this.date.getDate());
    }
    _hr() {
        return this._pad(this.date.getHours());
    }
    _min() {
        return this._pad(this.date.getMinutes());
    }
    _sec() {
        return this._pad(this.date.getSeconds());
    }
    _mls() {
        return this.date.getMilliseconds();
    }
    _pad(value) {
        return `0${value}`.slice(-2);
    }
}
TypeDate.DateOnly = 'DateOnly';
TypeDate.TimeOnly = 'TimeOnly';
TypeDate.DateTime = 'DateTime';
TypeDate.Timestamp = 'Timestamp';

class Bulk {
    constructor(tableName, columnSet = []) {
        if (typeof tableName !== 'string' || tableName.trim() === '') {
            throw Error('Please provide a valid table name to which you want to bulk insert');
        }
        this.tableName = tableName;
        if (Array.isArray(columnSet) && columnSet.length > 0 && columnSet.every((v) => v instanceof Column)) {
            this.columnSet = columnSet;
        }
    }
    setTableName(tblName) {
        this.tableName = tblName;
    }
    resetColumns(columnSet) {
        if (Array.isArray(columnSet) && columnSet.length > 0 && columnSet.every((v) => v instanceof Column)) {
            this.columnSet = columnSet;
        }
    }
    insert(valueSet) {
        if (!Array.isArray(this.columnSet) || this.columnSet.length === 0) {
            throw Error('The table column definition is empty and cannot perform insert operation. Provide array of type `Column` via constructor or resetColumns function.');
        }
        const [firstValueSet] = valueSet;
        if (typeof firstValueSet !== 'object' || !firstValueSet) {
            throw Error('Please provide a valid object to the (new Bulk(conn, )).insert([{...}])')
        }
        const prefix = this._preStmt();
        const postfix = this._valueStmt(valueSet);
        return `${prefix}${postfix}`;
    }
    _preStmt() {
        const cols = this.columnSet.map((column) => {
            let columnName = column.name;
            if (column.alias) {
                columnName = column.alias;
            } else if (column.underscored) {
                columnName = Column.toSnake(column.name);
            }
            return columnName;
        });
        return `INSERT INTO ${this.tableName} (${cols.join(', ')}) VALUES `;
    }
    _valueStmt(valueSet) {
        const insertRowSet = valueSet.map((valueRow) => {
            const parsedRowValueSet = this.columnSet.map((orderedColumn) => {
                const curColValue = valueRow[orderedColumn.name];
                const parsedInsertValue = orderedColumn.cast(curColValue);
                return parsedInsertValue;
            });
            return `(${parsedRowValueSet.join(', ')})`;
        });
        return insertRowSet.join(', ');
    }
}

const STR_THRESH = 255;
const varchar = (size = STR_THRESH) => `size: ${size}`;

const Type = Object.freeze({
    Text: 'Text',
    Json: 'Json',
    JsonB: 'JsonB',
    Array: 'Array',
    Float: 'Float',
    String: varchar,
    Varchar: varchar,
    Boolean: 'Boolean',
    Integer: 'Integer',
    Number: 'Number(Float)',
    DateOnly: TypeDate.DateOnly,
    TimeOnly: TypeDate.TimeOnly,
    DateTime: TypeDate.DateTime,
    Timestamp: TypeDate.Timestamp,
});

class Column {
    constructor(name, type, {
        alias = null,
        required = false,
        underscored = true,
        defaultValue = null,
    } = {}) {
        if (typeof type !== 'function' && !Type[type] && type.indexOf('size') === -1) {
            console.log(type);
            throw Error(`Please provide a valid type using Type[YOUR_DATA_TYPE]. Provided is ${type}`);
        }
        this.name = name;
        this.alias = alias;
        this.dataType = type;
        this.hasMaxSize = false;
        this.required = required;
        this.underscored = underscored;
        this.defaultValue = defaultValue;
        if (typeof type === 'function' && type === varchar) {
            this.hasMaxSize = true;
            this.dataType = 'string';
            this.length = STR_THRESH;
        } else if (typeof type === 'string' && type.indexOf('size:') > -1) {
            this.hasMaxSize = true;
            this.dataType = 'string';
            this.length = +(type.replace('size: '));
        }
    }
    cast(value) {
        switch (this.dataType) {
            case 'string':
                if (!value && this.required) {
                    this._error(value);
                }
                return this._strHelper(value, this.length);
            case Type.Text:
                if (!value && this.required) {
                    this._error(value);
                }
                return this._strHelper(value);
            case Type.Float:
            case Type.Number:
            case Type.Integer:
                if (isNaN(+value) && this.required) {
                    this._error(value);
                }
                return this.dataType === Type.Integer ? parseInt(+value, 10) : +value;
            case Type.Boolean:
                return Boolean(value);
            case Type.Array:
                if (!Array.isArray(value) && this.required) {
                    this._error(value);
                }
                return Array.isArray(value) ? this._strHelper(JSON.stringify(value)) : null;
            case Type.Json:
            case Type.JsonB:
                if (
                    (typeof value !== 'object' && this.required)
                    || (!value && this.required)
                ) {
                    this._error(value);
                }
                try {
                    return this._strHelper(JSON.stringify(value));
                } catch (e) {
                    if (this.required) {
                        this._error(value, e.message);
                    }
                    return this.defaultValue || 'NULL';
                }
            case Type.DateOnly:
            case Type.TimeOnly:
            case Type.DateTime:
            case Type.Timestamp:
                try {
                    const parsedValue = new TypeDate(value, this.dataType);
                    return parsedValue.get();
                } catch (e) {
                    if (this.required) {
                        this._error(value);
                    }
                    return this.defaultValue || 'NULL';
                }
            default:
                return this._strHelper(String(value));
        }
    }
    _error(value, appendStack = '') {
        throw Error(`The 'Required' column '${this.name}' is of ${this.dataType} type and is provided with value '${value}'. ${appendStack}`);
    }
    _strHelper(str, length) {
        if (!str) return this.defaultValue || 'NULL';
        return `'${(str.slice(0, length || undefined)).replace(/\'/g, "\'")}'`;
    }
}

Column.toSnake = (str = '') => (str || '').split(/(?=[A-Z])/).join('_').toLowerCase();

module.exports = {
    Type,
    Bulk,
    Column,
};
