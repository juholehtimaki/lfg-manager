import {
  FormControl,
  InputLabel,
  Modal,
  Paper,
  TextField,
  Typography,
  Select,
  MenuItem,
  Button,
  Avatar,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useState } from "react";
import {
  getClassNameList,
  Character,
  ClassNames,
  classIcons,
} from "../../utils/CharacterUtils";
import { v4 as uuidv4 } from "uuid";

type Props = {
  visible: boolean;
  handleClose: () => void;
  handleAddCharacter?: (newCharacter: Character) => void;
  handleEditCharacter?: (editedCharacter: Character) => void;
  editCharacter?: Character;
};
export function CreateCharacterModal({
  visible,
  handleClose,
  handleAddCharacter,
  handleEditCharacter,
  editCharacter,
}: Props) {
  const [charName, setCharName] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<ClassNames>(
    ClassNames.DEFAULT
  );
  const [itemLevel, setItemLevel] = useState<number>(1);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (editCharacter !== undefined) {
      setCharName(editCharacter.charName);
      setItemLevel(editCharacter.itemLevel);
      setSelectedClass(editCharacter.character);
    }
  }, [editCharacter, clearState]);

  function validateInputs() {
    let valid = true;
    if (
      charName.length === 0 ||
      selectedClass === ClassNames.DEFAULT ||
      itemLevel === 0
    ) {
      setError(true);
      valid = false;
    }
    return valid;
  }
  function createNewCharacter() {
    const newChar: Character = {
      id: editCharacter !== undefined ? editCharacter.id : uuidv4(),
      charName,
      character: selectedClass,
      itemLevel,
    };
    return newChar;
  }
  function clearState() {
    setCharName("");
    setSelectedClass(ClassNames.DEFAULT);
    setItemLevel(0);
    setError(false);
  }
  return (
    <Modal
      open={visible}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={styles.modal}
    >
      <Paper sx={styles.container}>
        <Box>
          <Box sx={styles.row}>
            <TextField
              fullWidth
              error={error && charName.length === 0}
              label="Character name"
              value={charName}
              variant="standard"
              required={true}
              onChange={(e) => setCharName(e.target.value)}
              sx={{ ...styles.itemsMargin, marginRight: "5px" }}
            />

            <TextField
              error={error && itemLevel === 0}
              label="Item level"
              variant="standard"
              type={"number"}
              value={itemLevel === 0 ? "" : itemLevel}
              required={true}
              onChange={(e) => setItemLevel(Number(e.target.value))}
              sx={{ ...styles.itemsMargin, marginLeft: "5px" }}
            />
          </Box>

          <FormControl fullWidth sx={styles.itemsMargin} required={true}>
            <InputLabel id="demo-simple-select-label">Class</InputLabel>
            <Select
              error={error && selectedClass === ClassNames.DEFAULT}
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={selectedClass}
              label="Class"
              startAdornment={
                <Avatar
                  src={classIcons[selectedClass]}
                  sx={{ marginRight: "10px" }}
                />
              }
              onChange={(e) => setSelectedClass(e.target.value as ClassNames)}
            >
              {getClassNameList().map((gameClass) => (
                <MenuItem key={gameClass} value={gameClass}>
                  {gameClass}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={styles.actionButtons}>
          <Button
            onClick={() => {
              clearState();
              handleClose();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (validateInputs()) {
                if (handleAddCharacter !== undefined) {
                  handleAddCharacter(createNewCharacter());
                } else if (handleEditCharacter !== undefined) {
                  handleEditCharacter(createNewCharacter());
                }

                clearState();
              }
            }}
          >
            {editCharacter ? "Confirm" : "Add"}
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
}
const styles: { [key: string]: React.CSSProperties } = {
  modal: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "5em",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    padding: "1em",
    justifyContent: "space-between",
  },
  itemsMargin: {
    marginBottom: "3em",
  },
  actionButtons: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  row: {
    display: "flex",
    flexDirection: "row",
  },
};
